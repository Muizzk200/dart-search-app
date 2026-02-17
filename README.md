<<<<<<< HEAD
# DART SDSE V1.0

## Short Description Search Engine

**DART SDSE V1.0 – Made by MUIZZ**

---

## Overview

DART SDSE V1.0 is a web-based search engine designed to help you quickly find products by searching their Short Descriptions. It replicates the powerful search functionality of an Excel-based DART tool but with a user-friendly web interface.

Instead of struggling with Excel filters or SAP searches, DART SDSE V1.0 lets you:
- Upload an Excel DART file with your product inventory
- Search using multiple keywords in any order
- Get instant results with highlighted matches
- Handle up to 200,000 product rows effortlessly

---

## Features

✅ **Easy File Upload** – Upload Excel (.xlsx) files containing your product data  
✅ **Powerful Search** – Find products using keywords in any order  
✅ **Case-Insensitive** – Search is case-insensitive for flexibility  
✅ **Partial Matches** – Partial word matches are supported (e.g., "bolt" finds "bolts")  
✅ **Fast Results** – Searches through thousands of rows instantly  
✅ **Large Dataset Support** – Handles up to 200,000 product rows  
✅ **Clean Interface** – User-friendly, internal-tool style UI  
✅ **No Database Required** – All processing happens in memory  

---

## How to Run Locally

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Installation Steps

1. **Navigate to the project folder:**
   ```bash
   cd DART_SDSE_V1
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Open in your browser:**
   ```
   http://localhost:5000
   ```

The application will start on `http://127.0.0.1:5000` by default.

---

## How to Upload Files

### File Requirements
- **Format:** Excel (.xlsx) only
- **Sheet Name:** Rename your worksheet to "DART" (or upload any sheet, it will use the first available)
- **Column Structure:**
  - Column A: Item No
  - Column B: Short Description
  - Column H: Sales Status
  - Column I: Product Division
  - Column O: Manufacturer Name
  - Column P: Manufacturer Item No
- **Data:** Start from row 2 (row 1 is headers)
- **Max Rows:** Up to 200,000 rows supported

### Steps to Upload
1. Click **"Choose Excel File"** button
2. Select your DART .xlsx file
3. Click **"Upload File"**
4. Wait for success confirmation
5. You're ready to search!

---

## How Search Works

### Search Logic
The search functionality works exactly like the Excel DART formula:

1. **Input:** You enter one or more keywords (e.g., "bolt steel m6")
2. **Processing:** Keywords are:
   - Split by spaces into individual words
   - Converted to lowercase
   - Searched as partial matches
3. **Match Criteria:** A product matches ONLY if **ALL keywords** are found in its Short Description
4. **Result:** Products matching all keywords are displayed in a table

### Examples

| Search Query | Description | Match? |
|---|---|---|
| "bolt" | "M6 Steel Bolt Fastener" | ✅ Yes |
| "bolt steel" | "M6 Steel Bolt Fastener" | ✅ Yes |
| "steel bolt" | "M6 Steel Bolt Fastener" | ✅ Yes (order doesn't matter) |
| "bolt m8" | "M6 Steel Bolt Fastener" | ❌ No (m8 not found) |
| "bol" | "M6 Steel Bolt Fastener" | ✅ Yes (partial match) |

### Search Tips
- **Multiple keywords:** Type as many keywords as you need, separated by spaces
- **Order independent:** Keywords can be in any order
- **Partial matches:** Works with partial words (e.g., "bolt" matches "bolts")
- **Case insensitive:** "BOLT", "bolt", or "Bolt" all work the same
- **Whitespace trimming:** Extra spaces are automatically removed

---

## Output Columns

Search results display the following information in this exact order:

| Column | Description |
|---|---|
| **Item No** | Product item number |
| **Description** | Full short description of the product (keywords highlighted) |
| **Product Division** | The division this product belongs to |
| **Manufacturer Name** | Name of the manufacturer |
| **Manufacturer Item No** | Manufacturer's item number |
| **Sales Status** | Current sales status of the product |

---

## Limitations

1. **Short Description Only:**
   - Search is limited to the Short Description column (Column B)
   - Cannot search by Item No, Manufacturer Name, or other fields

2. **Exact Wording Matters:**
   - Differences in spelling, abbreviations, or wording may affect results
   - Example: "bolt" won't find "screw" even if they're similar fasteners

3. **Partial Matches Help But Don't Eliminate Issues:**
   - Using shorter keywords (e.g., "bol" instead of "bolt") can improve results
   - However, abbreviations or completely different names may still not match

---

## Why DART SDSE V1.0?

### Problems It Solves
- **Excel Limitations:** Excel's built-in search is cumbersome with large datasets
- **Order Dependency:** Traditional searches require keywords in a specific order
- **Performance:** Searching 200,000 rows in Excel is slow and resource-intensive
- **SAP Limitations:** SAP searches can be complex and slow for quick lookups

### Advantages
- ✅ Search keywords in any order
- ✅ Instant results across thousands of products
- ✅ No database setup required
- ✅ Fast, lightweight web interface
- ✅ Easy to use and intuitive
- ✅ Built specifically for product discovery workflows

### Future Enhancements
- Direct search by Item No
- Search by Manufacturer Item No
- Filter by Division or Sales Status
- Export results to Excel
- Multiple file support and comparison
- Custom column selection

---

## Project Structure

```
DART_SDSE_V1/
├── app.py                 # Flask backend application
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── style.css         # Styling and layout
│   └── script.js         # Frontend JavaScript logic
└── uploads/              # Temporary file uploads folder
```

---

## Technical Details

### Backend (Python + Flask)
- **Framework:** Flask 2.3.2
- **Excel Parsing:** openpyxl 3.1.2
- **Data Processing:** In-memory search without database
- **File Upload:** Secure file handling with validation

### Frontend (HTML/CSS/JavaScript)
- **Responsive Design:** Works on desktop, tablet, mobile
- **Dynamic Search:** Real-time results without page reload
- **Keyword Highlighting:** Matched keywords highlighted in results
- **Error Handling:** User-friendly error messages and status updates

### Search Algorithm
```python
# Pseudocode of the search logic
for each product in dataset:
    description = product.short_description.lowercase()
    all_keywords_found = all(keyword in description for keyword in search_keywords)
    if all_keywords_found:
        add product to results
```

---

## Troubleshooting

### "No file loaded. Please upload a file first"
- Make sure you've successfully uploaded an Excel file
- Check that the file is in .xlsx format
- Look for the green success message after upload

### "No Match Found"
- Try using partial keywords (e.g., "bolt" instead of "bolts")
- Check spelling of keywords
- Use fewer keywords to broaden the search
- Remember: ALL keywords must be present in the description

### Upload fails with "Error parsing file"
- Ensure the Excel file is not corrupted
- Make sure the worksheet is named "DART" (optional but recommended)
- Check that data starts from row 2 (row 1 is headers)
- Ensure all required columns are present

### Application won't start
- Make sure Python 3.7+ is installed: `python --version`
- Install dependencies: `pip install -r requirements.txt`
- Check if port 5000 is already in use
- Try running with a different port: `python app.py` (modify port in app.py)

---

## Performance Notes

- **Upload Speed:** Depends on file size (typically 1-30 seconds for 200k rows)
- **Search Speed:** Instant (< 100ms for most searches)
- **Memory Usage:** Proportional to file size (200k rows ≈ 50-100MB)
- **Supported Files:** Excel files up to 50MB

---

## Browser Compatibility

✅ Chrome/Chromium (recommended)  
✅ Firefox  
✅ Safari  
✅ Edge  
✅ Opera  

---

## Author

**DART SDSE V1.0 – Made by MUIZZ**

---

## License

For internal use. Contact the author for distribution or modifications.

---

## Version History

### V1.0 (January 2025)
- Initial release
- File upload functionality
- Keyword search with partial matching
- Multi-column results display
- Web-based interface

---

## Support & Feedback

For issues, suggestions, or questions about DART SDSE V1.0, please contact MUIZZ.

---

**Last Updated:** January 2025  
**Status:** Active & Maintained
=======
# dart-search-app
DART Search
>>>>>>> 267c2d54ee45740ad5c0e764eea394d243db91f3
