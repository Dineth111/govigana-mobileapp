import os
import re
import sys
import time
import requests
from bs4 import BeautifulSoup
import pdfplumber
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables (for local development)
load_dotenv()

# Setup config
HARTI_METHOD = "pdf"  # "pdf" | "api" | "browser"
USER_AGENT = "GoviGana-Bot/1.0 (contact: dineth@example.com)"
HARTI_LIST_URL = "https://www.harti.gov.lk/daily-price.php"

# Market name mappings
MARKET_MAP = {
    "peliyagoda market": "Colombo",
    "dambulla market": "Dambulla",
    "narahenpita market": "Narahenpita",
    "mannar market": "Mannar",
    "pettah": "Colombo"
}

# Crop English names map to (Sinhala Name, Category)
CROP_MAP = {
    "beans": ("බෝංචි", "එළවළු"),
    "carrot": ("කැරට්", "එළවළු"),
    "leeks": ("ලීක්ස්", "එළවළු"),
    "beet root": ("බීට්", "එළවළු"),
    "beet root (n eliya)": ("බීට් (නුවරඑළිය)", "එළවළු"),
    "knolkhol": ("නෝකෝල්", "එළවළු"),
    "raddish": ("රාබු", "එළවළු"),
    "cabbage (n'eliya)": ("ගෝවා (නුවරඑළිය)", "එළවළු"),
    "cabbage (kandy)": ("ගෝවා (මහනුවර)", "එළවළු"),
    "tomato": ("තක්කාලි", "එළවළු"),
    "ladies fingers": ("බණ්ඩක්කා", "එළවළු"),
    "brinjals": ("වම්බටු", "එළවළු"),
    "capsicum": ("මාළු මිරිස්", "එළවළු"),
    "pumpkin": ("වට්ටක්කා", "එළවළු"),
    "cucumber": ("පිපිඤ්ඤා", "එළවළු"),
    "bitter gourd": ("කරවිල", "එළවළු"),
    "snake gourd": ("පතෝල", "එළවළු"),
    "drumstick": ("මුරුංගා", "එළවළු"),
    "luffa": ("වැටකොළු", "එළවළු"),
    "long beans": ("මා කරල්", "එළවළු"),
    "ash plantains": ("අළු කෙසෙල්", "එළවළු"),
    "green chillies": ("අමු මිරිස්", "එළවළු"),
    "lime": ("දෙහි", "එළවළු"),
    "sweet potatoe": ("බතල", "එළවළු"),
    "manioc": ("මඤ්ඤොක්කා", "එළවළු"),
    "eggplant": ("වම්බටු (Eggplant)", "එළවළු"),
    "potato(imported)": ("අල (රට)", "එළවළු"),
    "potato (welimada)": ("අල (වැලිමඩ)", "එළවළු"),
    "potato (nuwaraeliya)": ("අල (නුවරඑළිය)", "එළවළු"),
    "b'onion imported": ("ලොකු ලූණු (රට)", "එළවළු"),
    "big-onion local": ("ලොකු ලූණු (දේශීය)", "එළවළු"),
    
    # Fruits
    "banana": ("කෙසෙල්", "පලතුරු"),
    "ambul(rs/kg)": ("ඇඹුල් කෙසෙල්", "පලතුරු"),
    "kolikuttu": ("කෝලිකුට්ටු කෙසෙල්", "පලතුරු"),
    "seeni": ("සීනි කෙසෙල්", "පලතුරු"),
    "anamalu (rs/fruits)": ("ආනමාලු කෙසෙල්", "පලතුරු"),
    "papaya (rs/kg)": ("පැපොල්", "පලතුරු"),
    "passion fruits(rs/fruit": ("පැෂන් පෘට්", "පලතුරු"),
    "pineapple - large": ("අන්නාසි (ලොකු)", "පලතුරු"),
    "pineapple - medium": ("අන්නාසි (මැද)", "පලතුරු"),
    "pineapple - small": ("අන්නාසි (පොඩි)", "පලතුරු"),
    "mango - betti": ("අඹ (බෙට්ටි)", "පලතුරු"),
    "mango - karathakol": ("අඹ (කර්තකොලොම්බන්)", "පලතුරු"),
    "woodapple": ("දිවුල්", "පලතුරු"),
    "avocado": ("අලිගැටපේර", "පලතුරු"),
    "orange": ("දොඩම්", "පලතුරු")
}

def clean_crop_name(raw_name):
    if not raw_name:
        return None, None
        
    name = raw_name.strip().lower()
    
    # Handle known exact matches
    if name in CROP_MAP:
        return CROP_MAP[name]
        
    # Check if there is a partial match in the map
    for key, val in CROP_MAP.items():
        if key in name:
            return val
            
    # Default fallbacks
    category = "එළවළු"
    if any(k in name for k in ["fruit", "banana", "mango", "pineapple", "orange", "papaya", "avocado", "seeni", "kolikuttu"]):
        category = "පලතුරු"
        
    return raw_name.strip(), category

def parse_price_value(price_str):
    """Parses a price string (which can be a single number or a range like 550- 600)
    and returns a single integer price. If it is a range, takes the average for HARTI,
    or can take the minimum for DCS.
    """
    if not price_str:
        return None
        
    # Find all numbers
    numbers = [int(n) for n in re.findall(r'\d+', price_str)]
    if not numbers:
        return None
        
    if len(numbers) == 1:
        return numbers[0]
    elif len(numbers) >= 2:
        # Take the average of the range
        return sum(numbers) // len(numbers)
    return None

def download_file(url, local_path):
    headers = {"User-Agent": USER_AGENT}
    print(f"Downloading: {url} ...")
    r = requests.get(url, headers=headers, timeout=30)
    r.raise_for_status()
    with open(local_path, "wb") as f:
        f.write(r.content)
    print(f"File downloaded to {local_path} (Size: {os.path.getsize(local_path)} bytes)")

def scrape_harti():
    """Scrapes the latest HARTI PDF report and returns a list of parsed price dictionaries."""
    print("--- STARTING HARTI SCRAPE ---")
    headers = {"User-Agent": USER_AGENT}
    
    # 1. Fetch the listing page to find the latest PDF link
    r = requests.get(HARTI_LIST_URL, headers=headers, timeout=15)
    r.raise_for_status()
    
    soup = BeautifulSoup(r.text, 'html.parser')
    table = soup.find('table')
    if not table:
        raise Exception("Could not find daily price table list on HARTI website.")
        
    first_pdf_link = None
    target_date = None
    
    # Iterate table rows to find the first PDF link and its date
    for row in table.find_all('tr')[1:]:  # Skip header row
        cols = row.find_all('td')
        if len(cols) >= 3:
            date_str = cols[0].get_text(strip=True)
            a_tag = cols[2].find('a')
            if a_tag and a_tag.get('href') and a_tag.get('href').endswith('.pdf'):
                first_pdf_link = a_tag.get('href')
                target_date = date_str
                break
                
    if not first_pdf_link:
        raise Exception("No daily price PDF files found in the HARTI price table.")
        
    # Clean and build absolute URL
    if not first_pdf_link.startswith('http'):
        first_pdf_link = "https://www.harti.gov.lk/" + first_pdf_link.lstrip('/')
        
    print(f"Latest Daily Price Report Date: {target_date}")
    print(f"PDF Download Link: {first_pdf_link}")
    
    # 2. Download the PDF locally
    local_pdf = "harti_daily.pdf"
    download_file(first_pdf_link, local_pdf)
    
    # 3. Parse the PDF using pdfplumber
    parsed_rows = []
    
    with pdfplumber.open(local_pdf) as pdf:
        # Page 1 contains the Vegetables & Fruits wholesale prices in English
        if len(pdf.pages) < 2:
            raise Exception("HARTI PDF has fewer than 2 pages. Layout might have changed.")
            
        page = pdf.pages[1]
        tables = page.extract_tables()
        if not tables:
            raise Exception("No tables found on page 1 of the HARTI PDF.")
            
        table_data = tables[0]
        if len(table_data) < 3:
            raise Exception("Daily price table has too few rows.")
            
        # Inspect headers from row 1
        headers_row = table_data[1]
        market_cols = {}  # maps market_name -> column_index
        
        for idx, col in enumerate(headers_row):
            if col:
                col_clean = col.lower().replace('\n', ' ').strip()
                if col_clean in MARKET_MAP:
                    mapped_market = MARKET_MAP[col_clean]
                    market_cols[mapped_market] = idx
                    
        print(f"Mapped markets to columns: {market_cols}")
        if "Colombo" not in market_cols and "Dambulla" not in market_cols:
            raise Exception("Could not map 'Colombo' or 'Dambulla' to any table columns.")
            
        current_main_crop = ""
        
        # Start parsing crop rows (skip headers at rows 0, 1, 2)
        for row_idx in range(3, len(table_data)):
            row = table_data[row_idx]
            if not row or len(row) == 0:
                continue
                
            raw_crop_name = row[0]
            if not raw_crop_name:
                continue
                
            raw_crop_name = raw_crop_name.strip()
            
            # Skip group headers or empty dividers
            if raw_crop_name in ["Up Country Vegetable", "Low country Vegetable", "Banana", "Other Fruits", "Variety", "Item"] or len(raw_crop_name) == 0:
                continue
                
            # Handle child items (e.g. "- Medium", "- Small", "- Karathakol")
            if raw_crop_name.startswith('-'):
                # Append to current main crop
                full_crop_name = f"{current_main_crop} {raw_crop_name}"
            else:
                full_crop_name = raw_crop_name
                # Update current main crop (take the first word as baseline or full name)
                # E.g. "Pineapple - Large" becomes the main crop "Pineapple" for subsequent "- Medium" rows
                if " - " in raw_crop_name:
                    current_main_crop = raw_crop_name.split(" - ")[0]
                elif " " in raw_crop_name:
                    current_main_crop = raw_crop_name.split(" ")[0]
                else:
                    current_main_crop = raw_crop_name
                    
            # Map crop to Sinhala name and category
            sinhala_crop, category = clean_crop_name(full_crop_name)
            
            # Parse price for each mapped market
            for market_name, col_idx in market_cols.items():
                if col_idx < len(row):
                    price_str = row[col_idx]
                    if price_str and price_str.strip() not in ["-", "n.a", "n/a", ""]:
                        parsed_price = parse_price_value(price_str)
                        if parsed_price:
                            parsed_rows.append({
                                "market": market_name,
                                "category": category,
                                "crop": sinhala_crop,
                                "price": parsed_price,
                                "unit": "Kg",
                                "date": target_date,
                                "source": "HARTI"
                            })
                            
    # Clean up local PDF
    if os.path.exists(local_pdf):
        os.remove(local_pdf)
        
    print(f"Successfully scraped {len(parsed_rows)} rows from HARTI.")
    return parsed_rows, target_date

def scrape_dcs_pdf(pdf_url):
    """Fallback function: Parses a specific DCS weekly retail price PDF and returns rows."""
    print("--- STARTING DCS SCRAPE FALLBACK ---")
    local_pdf = "dcs_fallback.pdf"
    
    # 1. Download the DCS PDF
    download_file(pdf_url, local_pdf)
    
    parsed_rows = []
    # Deduce date from URL or default to today
    # e.g., URL containing .../2026/June/retail_2026-06-15.pdf
    date_match = re.search(r'\d{4}-\d{2}-\d{2}', pdf_url)
    target_date = date_match.group(0) if date_match else time.strftime("%Y-%m-%d")
    
    # 2. Parse DCS PDF
    with pdfplumber.open(local_pdf) as pdf:
        print(f"DCS PDF pages: {len(pdf.pages)}")
        # In DCS weekly reports, the first few pages list Colombo district retail prices.
        # We will parse all pages and extract items we recognize in Narahenpita or Mannar.
        for p_idx, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            for t_idx, table in enumerate(tables):
                if not table or len(table) < 2:
                    continue
                    
                # Look for header cells containing 'Market' or 'Item'
                # DCS reports typically list Item in col 0, and markets in subsequent columns (like Narahenpita, Pettah, etc.)
                header = table[0]
                market_cols = {}
                for idx, col in enumerate(header):
                    if col:
                        col_clean = col.lower().replace('\n', ' ').strip()
                        # Match DCS markets to our target markets
                        for key, val in MARKET_MAP.items():
                            if key in col_clean or val.lower() in col_clean:
                                market_cols[val] = idx
                                
                if not market_cols:
                    continue
                    
                # Parse item rows
                for row in table[1:]:
                    if not row or not row[0]:
                        continue
                    raw_crop_name = row[0].strip()
                    sinhala_crop, category = clean_crop_name(raw_crop_name)
                    
                    # We only care about crops that mapped successfully
                    if not sinhala_crop:
                        continue
                        
                    for market_name, col_idx in market_cols.items():
                        if col_idx < len(row):
                            price_str = row[col_idx]
                            if price_str and price_str.strip() not in ["-", "n/a", ""]:
                                # DCS range taking minimum value as requested
                                numbers = [int(n) for n in re.findall(r'\d+', price_str)]
                                if numbers:
                                    parsed_price = min(numbers) # Minimum value for range
                                    parsed_rows.append({
                                        "market": market_name,
                                        "category": category,
                                        "crop": sinhala_crop,
                                        "price": parsed_price,
                                        "unit": "Kg",
                                        "date": target_date,
                                        "source": "DCS"
                                    })
                                    
    # Clean up local PDF
    if os.path.exists(local_pdf):
        os.remove(local_pdf)
        
    print(f"Successfully scraped {len(parsed_rows)} rows from DCS fallback.")
    return parsed_rows, target_date

def save_to_supabase(supabase_client, rows, target_date):
    """Saves rows to Supabase database, calculating day-over-day price changes."""
    print("--- SAVING TO SUPABASE ---")
    success_count = 0
    
    for row in rows:
        market = row["market"]
        crop = row["crop"]
        price = row["price"]
        date = row["date"]
        source = row["source"]
        category = row["category"]
        
        # Calculate change: Fetch previous price for same market + crop
        change = None
        try:
            # Query the latest record on a date prior to the current date
            res = supabase_client.table("prices").select("price") \
                .eq("market", market) \
                .eq("crop", crop) \
                .lt("date", date) \
                .order("date", desc=True) \
                .limit(1) \
                .execute()
                
            if res.data and len(res.data) > 0:
                prev_price = res.data[0]["price"]
                change = price - prev_price
        except Exception as e:
            print(f"Warning: Failed to fetch previous price for change calculation ({market} - {crop}): {e}")
            
        # Prepare data payload
        payload = {
            "market": market,
            "category": category,
            "crop": crop,
            "price": price,
            "unit": "Kg",
            "date": date,
            "change": change,
            "source": source
        }
        
        # Upsert record (resolving duplicate conflicts on market, crop, date)
        try:
            supabase_client.table("prices").upsert(payload, on_conflict="market,crop,date").execute()
            success_count += 1
        except Exception as e:
            print(f"Error inserting row ({market} - {crop} on {date}): {e}")
            
    print(f"Upserted {success_count} / {len(rows)} rows into Supabase.")
    return success_count

def log_scraper_run(supabase_client, source_used, success, rows_written, error_message=None):
    """Writes a log record to the scraper_runs table."""
    try:
        payload = {
            "source_used": source_used,
            "success": success,
            "rows_written": rows_written,
            "error_message": error_message
        }
        supabase_client.table("scraper_runs").insert(payload).execute()
        print("Logged scraper run status to database successfully.")
    except Exception as e:
        print(f"Critical: Failed to log scraper run details to Supabase: {e}")

def main():
    print(f"GoviGana Scraper Bot Started: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # 1. Authenticate with Supabase
    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("EXPO_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("EXPO_PUBLIC_SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        print("Critical Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables must be set!")
        sys.exit(1)
        
    supabase_client: Client = create_client(supabase_url, supabase_key)
    
    rows = []
    source_used = "HARTI"
    success = False
    error_msg = None
    target_date = None
    
    # 2. Execute scraping
    try:
        # Step A: Attempt HARTI daily PDF scrape
        rows, target_date = scrape_harti()
        success = True
    except Exception as e:
        # Step B: HARTI failed, log it and attempt fallback
        error_msg = f"HARTI Scraper failed: {str(e)}"
        print(f"Error: {error_msg}")
        
        # Check if DCS fallback URL is provided in config/environment
        dcs_url = os.environ.get("DCS_PDF_URL_PATTERN")
        if dcs_url:
            print(f"Attempting DCS fallback using URL: {dcs_url}")
            time.sleep(3) # Delay between requests
            try:
                rows, target_date = scrape_dcs_pdf(dcs_url)
                source_used = "DCS"
                success = True
                error_msg = None # Cleared since fallback succeeded
            except Exception as dcs_e:
                error_msg += f" | DCS Fallback failed: {str(dcs_e)}"
                print(f"Critical: DCS fallback failed too: {dcs_e}")
        else:
            print("No DCS_PDF_URL_PATTERN environment variable configured. Skipping fallback.")
            
    # 3. Save to Database and log runs
    rows_written = 0
    if success and rows:
        try:
            rows_written = save_to_supabase(supabase_client, rows, target_date)
        except Exception as db_e:
            success = False
            error_msg = f"Database Save Error: {str(db_e)}"
            print(f"Error: {error_msg}")
            
    # Record run result in database
    log_scraper_run(supabase_client, source_used, success, rows_written, error_msg)
    
    if success:
        print("Scraper run completed successfully.")
    else:
        print("Scraper run failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
