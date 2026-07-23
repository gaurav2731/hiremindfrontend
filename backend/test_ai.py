from app.core.config import settings
print(f'API KEY: {settings.openai_api_key}')
print(f'BASE URL: {settings.llm_base_url}')
import openai
client = openai.OpenAI(api_key=settings.openai_api_key, base_url=settings.llm_base_url)
try:
    response = client.chat.completions.create(
        model=settings.llm_model,
        messages=[{'role': 'user', 'content': 'Say hi'}]
    )
    print('SUCCESS:', response.choices[0].message.content)
except Exception as e:
    print('ERROR:', e)
