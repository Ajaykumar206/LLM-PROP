import time
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import torch
from torch.utils.data import DataLoader
from transformers import get_linear_schedule_with_warmup
from src.utils.logging_config import logger
from src.utils.config import settings

class T5Trainer:
    """
    Trainer for fine-tuning T5 models on material properties and structural descriptors.
    """
    def __init__(
        self,
        model,
        tokenizer,
        device: Optional[torch.device] = None,
        learning_rate: float = 3e-4,
        weight_decay: float = 0.01,
        early_stopping_patience: int = 2
    ):
        self.model = model
        self.tokenizer = tokenizer
        self.device = device or torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model.to(self.device)
        self.learning_rate = learning_rate
        self.weight_decay = weight_decay
        self.early_stopping_patience = early_stopping_patience

    def train(
        self,
        train_dataset,
        val_dataset,
        epochs: int = 3,
        batch_size: int = 16,
        output_dir: Optional[Path] = None
    ) -> Dict[str, Any]:
        output_dir = output_dir or settings.T5_MODEL_DIR
        output_dir.mkdir(parents=True, exist_ok=True)

        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

        no_decay = ["bias", "LayerNorm.weight"]
        optimizer_grouped_parameters = [
            {
                "params": [p for n, p in self.model.named_parameters() if not any(nd in n for nd in no_decay)],
                "weight_decay": self.weight_decay,
            },
            {
                "params": [p for n, p in self.model.named_parameters() if any(nd in n for nd in no_decay)],
                "weight_decay": 0.0,
            },
        ]
        optimizer = torch.optim.AdamW(optimizer_grouped_parameters, lr=self.learning_rate)

        total_steps = len(train_loader) * epochs
        scheduler = get_linear_schedule_with_warmup(
            optimizer,
            num_warmup_steps=int(total_steps * 0.08),
            num_training_steps=total_steps
        )

        best_val_loss = float("inf")
        best_weights = None
        no_improve_epochs = 0
        history = []

        logger.info(f"Starting T5 training for {epochs} epochs on device {self.device}...")
        start_time = time.time()

        for epoch in range(1, epochs + 1):
            self.model.train()
            total_train_loss = 0.0
            steps = 0

            for batch in train_loader:
                optimizer.zero_grad()
                input_ids = batch["input_ids"].to(self.device)
                attention_mask = batch["attention_mask"].to(self.device)
                labels = batch["labels"].to(self.device)

                outputs = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )
                loss = outputs.loss
                loss.backward()
                torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
                optimizer.step()
                scheduler.step()

                total_train_loss += loss.item()
                steps += 1

            avg_train_loss = total_train_loss / max(1, steps)

            # Validation phase
            self.model.eval()
            total_val_loss = 0.0
            val_steps = 0
            with torch.no_grad():
                for batch in val_loader:
                    input_ids = batch["input_ids"].to(self.device)
                    attention_mask = batch["attention_mask"].to(self.device)
                    labels = batch["labels"].to(self.device)
                    outputs = self.model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
                    total_val_loss += outputs.loss.item()
                    val_steps += 1

            avg_val_loss = total_val_loss / max(1, val_steps)
            epoch_data = {
                "epoch": epoch,
                "train_loss": round(avg_train_loss, 4),
                "val_loss": round(avg_val_loss, 4),
            }
            history.append(epoch_data)
            logger.info(f"Epoch {epoch}/{epochs} - Train Loss: {avg_train_loss:.4f} | Val Loss: {avg_val_loss:.4f}")

            if avg_val_loss < best_val_loss:
                best_val_loss = avg_val_loss
                best_weights = {k: v.cpu().clone() for k, v in self.model.state_dict().items()}
                no_improve_epochs = 0
            else:
                no_improve_epochs += 1
                if no_improve_epochs >= self.early_stopping_patience:
                    logger.info(f"Early stopping triggered at epoch {epoch}")
                    break

        if best_weights:
            self.model.load_state_dict(best_weights)
            self.model.to(self.device)

        duration = time.time() - start_time
        logger.info(f"Training completed in {duration:.2f}s with Best Val Loss: {best_val_loss:.4f}")

        # Save model and tokenizer
        if hasattr(self.model, "save_pretrained"):
            self.model.save_pretrained(output_dir)
        elif hasattr(self.model, "model") and hasattr(self.model.model, "save_pretrained"):
            self.model.model.save_pretrained(output_dir)

        if hasattr(self.tokenizer, "save_pretrained"):
            self.tokenizer.save_pretrained(output_dir)

        return {
            "best_val_loss": best_val_loss,
            "training_time_seconds": duration,
            "history": history
        }
