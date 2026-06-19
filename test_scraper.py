import sys
import os

# Set custom stdout encoding for Sinhala characters in Windows terminal
sys.stdout.reconfigure(encoding='utf-8')

print("Starting local dry-run scraper test...")

# Import scraper functions
from scraper import scrape_harti

try:
    print("\nCalling scrape_harti()...")
    rows, target_date = scrape_harti()
    
    print("\n=== DRY RUN SCRAPING SUMMARY ===")
    print(f"Daily Price Bulletin Date: {target_date}")
    print(f"Total Rows Scraped: {len(rows)}")
    
    if len(rows) > 0:
        print("\nFirst 10 Scraped Rows Sample:")
        for idx, row in enumerate(rows[:10]):
            print(f"  Row {idx + 1:02d}: Market={row['market']:<10} | Crop={row['crop']:<20} | Price={row['price']:<5} | Category={row['category']:<8} | Source={row['source']}")
            
        # Count Colombo vs Dambulla
        colombo_rows = len([r for r in rows if r['market'] == 'Colombo'])
        dambulla_rows = len([r for r in rows if r['market'] == 'Dambulla'])
        veg_rows = len([r for r in rows if r['category'] == 'එළවළු'])
        fruit_rows = len([r for r in rows if r['category'] == 'පලතුරු'])
        
        print("\nStatistics:")
        print(f"  Colombo market rows: {colombo_rows}")
        print(f"  Dambulla market rows: {dambulla_rows}")
        print(f"  Vegetable rows: {veg_rows}")
        print(f"  Fruit rows: {fruit_rows}")
        
        print("\n✅ DRY RUN SUCCESS: PDF downloader and table extraction are working perfectly!")
    else:
        print("\n⚠️ WARNING: No rows were scraped from the PDF. Check column mappings or layout.")
        
except Exception as e:
    print(f"\n❌ DRY RUN FAILED with error: {e}")
    import traceback
    traceback.print_exc()
