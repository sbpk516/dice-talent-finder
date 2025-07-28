# Dice Talent Finder

AI-powered candidate discovery system for Dice.com

## Quick Start

1. Add your OpenAI API key to `.env`:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

2. Test the job parser:
   ```bash
   npm run parse
   ```

3. Run tests:
   ```bash
   npm test
   ```

## Project Structure

- `src/parsers/` - Job requirement parsing logic
- `src/scrapers/` - Web scraping modules  
- `src/matching/` - Candidate matching algorithms
- `tests/` - Unit tests and test data
- `data/` - Cached results and datasets

## Development

- `npm run dev` - Run with auto-reload
- `npm run parse` - Test job parsing
- `npm run scrape` - Test web scraping
