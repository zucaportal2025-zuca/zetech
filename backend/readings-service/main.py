from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import datetime
import httpx
from bs4 import BeautifulSoup
import asyncio

app = FastAPI()

# Allow CORS for your Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000", "http://localhost:5173"],
    allow_methods=["GET"],
)

# USCCB daily readings URL pattern
USCCB_URL = "https://bible.usccb.org/bible/readings/{month}{day}{year}.cfm"

@app.get("/readings/{year}/{month}/{day}")
async def get_readings(year: int, month: int, day: int):
    try:
        # Format: month day year (e.g., 03192026 for March 19, 2026)
        url = USCCB_URL.format(
            month=str(month).zfill(2),
            day=str(day).zfill(2),
            year=year
        )
        
        print(f"Fetching: {url}")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all readings
            readings = []
            reading_elements = soup.find_all('div', class_='reading')
            
            for reading in reading_elements:
                # Get reading title (First Reading, Responsorial Psalm, etc.)
                title_elem = reading.find('h2')
                title = title_elem.text.strip() if title_elem else "Reading"
                
                # Get reading citation
                citation_elem = reading.find('h3')
                citation = citation_elem.text.strip() if citation_elem else ""
                
                # Get reading text
                text_elem = reading.find('div', class_='text')
                text = text_elem.text.strip() if text_elem else ""
                
                readings.append({
                    "title": title,
                    "citation": citation,
                    "text": text
                })
            
            return {
                "date": f"{year}-{month:02d}-{day:02d}",
                "readings": readings,
                "url": url
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "catholic-readings"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)