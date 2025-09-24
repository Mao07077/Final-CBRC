



from fastapi import APIRouter, HTTPException, Body
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

router = APIRouter()


# Load lightweight Parrot paraphraser model and tokenizer once at startup
tokenizer = AutoTokenizer.from_pretrained("prithivida/parrot_paraphraser_on_T5")
model = AutoModelForSeq2SeqLM.from_pretrained("prithivida/parrot_paraphraser_on_T5")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

@router.post("/api/paraphrase")
def paraphrase_question(data: dict = Body(...)):
    question = data.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="Missing 'question' field")
    text = f"paraphrase: {question}"
    encoding = tokenizer.encode_plus(text, return_tensors="pt")
    input_ids = encoding["input_ids"].to(device)
    attention_mask = encoding["attention_mask"].to(device)
    try:
        outputs = model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            max_length=128,
            do_sample=True,
            top_k=60,
            top_p=0.95,
            early_stopping=True,
            num_return_sequences=1
        )
        paraphrased = tokenizer.decode(outputs[0], skip_special_tokens=True, clean_up_tokenization_spaces=True)
        return {"paraphrased": paraphrased}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Paraphrasing error: {str(e)}")
