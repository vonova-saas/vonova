# Writer Articles Documentation

## Overview

The **Article AI Agents** project is a FastAPI-based web service that leverages AI agents powered by CrewAI and Cohere's language models to generate high-quality, structured blog articles on any given topic. This documentation focuses on the article writing process, particularly the role of the Writer agent in the multi-agent system.

## Project Architecture

The system employs a three-agent crew approach for article generation:

1. **Planner Agent**: Researches the topic, identifies trends, and creates a structured outline.
2. **Writer Agent**: Expands the outline into detailed, engaging content.
3. **Editor Agent**: Fact-checks, polishes, and ensures publication-ready quality.

## Writer Agent Details

### Role and Responsibilities

The Writer Agent is responsible for transforming the Planner's outline into a comprehensive blog article. Key responsibilities include:

- Expanding the structured outline into detailed, engaging content
- Naturally integrating SEO keywords throughout the article
- Using compelling section headings to improve readability
- Maintaining proper structure with introduction, body, and conclusion
- Ensuring factual accuracy with appropriate citations
- Proofreading for grammar, clarity, and coherence

### Configuration

The Writer Agent is configured in `crew/agents.py` with the following parameters:

- **Role**: "Content Writer for {topic}"
- **Goal**: "Write insightful, clear, and factually accurate blog posts about {topic}"
- **Backstory**: Describes the agent's expertise in professional writing, SEO integration, and fact-based content creation
- **Tools**: No additional tools (relies on the Planner's research)
- **Delegation**: Allowed (can collaborate with other agents if needed)

### Writing Process

The Writer Agent follows a systematic approach:

1. **Content Expansion**: Takes the Planner's outline and expands each section into 2-3 detailed paragraphs
2. **SEO Integration**: Incorporates relevant keywords naturally without keyword stuffing
3. **Structure Maintenance**: Ensures logical flow from introduction through main points to conclusion
4. **Citation Inclusion**: Adds factual references and sources where appropriate
5. **Tone Consistency**: Maintains a professional yet engaging voice suitable for blog content

### Output Format

The Writer Agent produces content in Markdown format, including:

- Main title (H1)
- Section headings (H2, H3)
- Properly formatted paragraphs
- Bullet points or numbered lists where appropriate
- Inline citations or references

### Integration with Other Agents

- **Input from Planner**: Receives a detailed outline with key points, SEO keywords, and research insights
- **Collaboration**: Can delegate to other agents for additional research if needed
- **Hand-off to Editor**: Passes the initial draft to the Editor for fact-checking and polishing

## API Usage for Article Generation

To generate an article using the Writer Agent:

```bash
curl -X POST "http://127.0.0.1:5010/generate_article" \
     -H "Content-Type: application/json" \
     -d '{"topic": "Your Topic Here"}'
```

The response will include the complete article in Markdown format, processed through all three agents.

## Configuration and Customization

### Language Support

The API supports automatic language detection and translation for topics and generated articles:
- **Arabic Support**: Topics in Arabic are automatically detected and translated to English for processing by the AI agents. The final article is then translated back to Arabic.
- **Language Detection**: Uses built-in utilities to identify the input language.
- **Translation**: Leverages translation services to handle multilingual content seamlessly.

### LLM Settings

The Writer Agent uses Cohere's command-r-plus-08-2024 model with:
- Temperature: 0.0 (deterministic output)
- Max Tokens: 4000 per call

These can be adjusted in `llm/cohere_llm.py` for different writing styles.

### Environment Variables

Key environment variables affecting the Writer Agent:
- `CO_API_KEY`: Cohere API key (required)
- `LOG_LEVEL`: Controls logging verbosity

## Performance Considerations

- Article generation typically takes 30-60 seconds
- The Writer Agent's output is limited to maintain quality and prevent excessive token usage
- Sequential processing ensures each agent builds on the previous one's work

## Troubleshooting

### Common Issues

1. **Inconsistent Output**: Check temperature settings; lower values produce more consistent results
2. **Token Limits**: If articles are truncated, increase `COHERE_MAX_TOKENS`
3. **Fact Accuracy**: Ensure the Planner provides sufficient research; the Writer relies on this foundation

### Logging

All Writer Agent activities are logged. Check `article_ai.log` for detailed execution information.

## Future Enhancements

Potential improvements to the Writer Agent:
- Multi-language support
- Custom writing styles (formal, casual, technical)
- Integration with additional research tools
- Real-time collaboration features

## Dependencies

The Writer Agent relies on:
- CrewAI for agent orchestration
- LangChain-Cohere for LLM integration
- FastAPI for the web service framework
- Comprehensive logging utilities

For the complete dependency list, see `requirements.txt`.

---
