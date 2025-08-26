# 🤝 Contributing to PDF Chat & Summarization AI

Thank you for your interest in contributing! This guide will help you get started.

## 🚀 Quick Setup for Contributors

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/chat_with_pdf_and_summarization.git
   cd chat_with_pdf_and_summarization
   ```

3. **Set up development environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Create your `.env` file**
   ```env
   GEMINI_API_KEY=your_api_key_here
   AI_HOST=127.0.0.1
   AI_PORT=5000
   LOG_LEVEL=DEBUG
   ```

## 🛠️ Development Guidelines

### Code Style
- Follow PEP 8 for Python code
- Use meaningful variable and function names
- Add docstrings to all functions and classes
- Keep functions small and focused

### Testing
- Test your changes locally before submitting
- Ensure the server starts without errors
- Test API endpoints with sample PDFs

### Commit Messages
Use conventional commit format:
```
feat: add new summarization feature
fix: resolve PDF parsing issue
docs: update API documentation
```

## 📝 Areas for Contribution

### High Priority
- [ ] Add support for more file formats (DOCX, TXT)
- [ ] Implement user authentication
- [ ] Add rate limiting
- [ ] Improve error handling

### Medium Priority
- [ ] Add caching for frequently asked questions
- [ ] Implement document comparison features
- [ ] Add export functionality for conversations
- [ ] Create web frontend interface

### Low Priority
- [ ] Add support for multiple languages
- [ ] Implement document version tracking
- [ ] Add analytics and usage metrics

## 🐛 Bug Reports

When reporting bugs, please include:
- Python version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Error messages or logs

## 💡 Feature Requests

For new features, please:
- Check if it already exists in issues
- Describe the use case
- Explain the expected behavior
- Consider implementation complexity

## 📋 Pull Request Process

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make your changes
3. Test thoroughly
4. Update documentation if needed
5. Submit a pull request with a clear description

## 🤔 Questions?

Feel free to open an issue for any questions about contributing!
