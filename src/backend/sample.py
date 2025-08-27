import ollama
from pydantic import BaseModel

class FormatResponse(BaseModel):
  ReviseQuestion: str
  correctAnswer: str
  wrongAnswerFirst: str
  wrongAnswerSecond: str
  wrongAnswerThird: str

def create_prompt(input_text):
    return (
        f"Given question: '{input_text}'\n\n"
        "1. Paraphrase the question.\n"
        "2. Maintain the question context or topic.\n"
        "3. All answer should be short and simple.\n"
        "4. Each wrong answers should be related to the correct answer.\n"
    )

input_response = create_prompt(" 	An association wherein the name of something is substituted by something that represents it.")
generated_response = ollama.generate(model='llama3.2', prompt=input_response, format=FormatResponse.model_json_schema())
print(generated_response.response)
 