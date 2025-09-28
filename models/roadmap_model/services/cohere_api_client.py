import cohere
from utils.logging_utils import setup_ai_logger

class CohereAPIClient:

    def __init__(self, api_key, model_name='command-r-plus-08-2024', log_level="INFO"):
        self.co = cohere.Client(api_key)
        self.model_name = model_name
        self.logger = setup_ai_logger(__name__, "cohere_api_client.log", log_level)
        self.logger.info(f"CohereAPIClient initialized with model: {self.model_name}")

    def chat_with_model(self, message, max_tokens=4000, temperature=0.0):
        self.logger.debug(f"Sending message to Cohere model '{self.model_name}'")
        try:
            response = self.co.chat(
                model=self.model_name,
                message=message,
                max_tokens=max_tokens,
                temperature=temperature
            )
            self.logger.debug("Received response from Cohere API")
            if not response.text or response.text.strip() == "":
                self.logger.warning("Received empty or invalid response text from Cohere API")
                return ""
            return response.text
        except cohere.CohereAPIError as e:
            self.logger.error(f"Cohere API error: {e}", exc_info=True)
            raise 
        except Exception as e:
            self.logger.error(f"An unexpected error occurred during Cohere API call: {e}", exc_info=True)
            raise
