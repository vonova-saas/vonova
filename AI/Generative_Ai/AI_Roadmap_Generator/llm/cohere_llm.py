import cohere

class CohereAPIClient:

    def __init__(self, api_key, model_name='command-r-plus-08-2024'):
        self.co = cohere.Client(api_key)
        self.model_name = model_name

    def chat_with_model(self, message, max_tokens=4000, temperature=0.0):
        try:
            response = self.co.chat(
                model=self.model_name,
                message=message,
                max_tokens=max_tokens,
                temperature=temperature
            )
            if not response.text or response.text.strip() == "":
                return ""
            return response.text
        except cohere.CohereAPIError as e:
            raise
        except Exception as e:
            raise
