# DART SDSE V1.0 - Quick Start Guide

## Get Started in 3 Minutes

### 1. Install Dependencies
Open Command Prompt or PowerShell and run:
```bash
pip install -r requirements.txt
```

### 2. Start the Application
```bash
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
```

### 3. Open in Browser
Go to: **http://localhost:5000**

---

## First Time Usage

1. **Prepare Your Excel File:**
   - Make sure it's in .xlsx format
   - Rename the worksheet to "DART" (recommended)
   - Ensure data starts from row 2

2. **Upload File:**
   - Click "Choose Excel File"
   - Select your DART file
   - Click "Upload File"
   - Wait for success message

3. **Search:**
   - Type keywords (e.g., "bolt steel")
   - Press Enter or click "Search"
   - View results instantly

4. **Clear & Search Again:**
   - Click "Clear" before new search
   - Upload a different file or search with new keywords

---

## File Structure Reminder

```
Column A → Item No
Column B → Short Description (SEARCH HERE)
Column C → [Other data]
...
Column H → Sales Status
Column I → Product Division
...
Column O → Manufacturer Name
Column P → Manufacturer Item No
```

---

## Common Issues

**Port 5000 already in use?**
- Edit `app.py` last line and change port: `app.run(debug=True, port=5001)`

**Module not found error?**
- Run: `pip install -r requirements.txt`

**File upload fails?**
- Check file is .xlsx (not .xls)
- Check for corrupted data in Excel

---

## Need Help?

See `README.md` for detailed documentation.

---

**DART SDSE V1.0 – Made by MUIZZ**
