# DART-Search V2.0 - Complete Setup Instructions

## Welcome to DART-Search V2.0!

This document provides step-by-step instructions to set up and run the application.

---

## System Requirements

- **Operating System:** Windows, macOS, or Linux
- **Python:** Version 3.7 or higher
- **Disk Space:** ~100MB (depends on data files)
- **RAM:** 512MB minimum, 2GB recommended
- **Browser:** Any modern browser (Chrome, Firefox, Safari, Edge)

---

## Step 1: Verify Python Installation

Open Command Prompt (Windows) or Terminal (Mac/Linux) and check Python version:

```bash
python --version
```

You should see `Python 3.7.x` or higher. If not installed, download from https://www.python.org/downloads/

---

## Step 2: Navigate to Project Directory

```bash
cd "C:\Users\mkachhi\Desktop\New folder\DART_SDSE_V1"
```

On macOS/Linux, use forward slashes: `~/Desktop/DART_SDSE_V1`

---

## Step 3: Create Virtual Environment (Optional but Recommended)

Creating a virtual environment keeps dependencies isolated:

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

---

## Step 4: Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- Flask 2.3.2
- Werkzeug 2.3.6
- openpyxl 3.1.2

**If you see permission errors on macOS/Linux:**
```bash
pip install --user -r requirements.txt
```

---

## Step 5: Verify Installation

Check that openpyxl is installed:

```bash
python -c "import openpyxl; print('openpyxl is installed')"
```

You should see: `openpyxl is installed`

---

## Step 6: Start the Application

Run the Flask app:

```bash
python app.py
```

You should see output like:
```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

---

## Step 7: Open in Browser

Open your web browser and go to:

```
http://localhost:5000
```

or

```
http://127.0.0.1:5000
```

You should see the DART-Search V2.0 interface!

---

## First Use Walkthrough

### Preparing Your Excel File

1. Open your Excel file containing product data
2. Rename the active worksheet to "DART" (optional but recommended)
3. Ensure:
   - Column A: Item No
   - Column B: Short Description
   - Column H: Sales Status
   - Column I: Product Division
   - Column O: Manufacturer Name
   - Column P: Manufacturer Item No
   - Row 1 contains headers
   - Data starts from Row 2
4. Save as Excel format (.xlsx)

### Uploading the File

1. Click **"Choose Excel File"** button
2. Browse and select your DART.xlsx file
3. Click **"Upload File"**
4. Wait for green success message
5. You'll see how many rows were loaded

### Performing a Search

1. Click in the search box
2. Type keywords: `bolt steel` (order doesn't matter)
3. Press **Enter** or click **"Search"**
4. Results appear in the table below
5. Keywords are highlighted in yellow
6. Each row shows: Item No, Description, Product Division, Manufacturer Name, Manufacturer Item No, Sales Status

### Clear and Search Again

1. Click **"Clear"** to reset results
2. Upload a different file or search with new keywords
3. Repeat

---

## Troubleshooting

### "Module not found" error

**Solution:** Reinstall dependencies
```bash
pip install -r requirements.txt --force-reinstall
```

### "Port 5000 already in use" error

**Solution 1:** Close other applications using port 5000

**Solution 2:** Change the port in app.py:
- Open `app.py` in a text editor
- Find the last line: `app.run(debug=True, host='0.0.0.0', port=5000)`
- Change `5000` to `5001` (or any free port)
- Save and restart

### File upload fails with "Error parsing file"

**Check:**
1. File is in .xlsx format (not .xls)
2. File is not corrupted
3. File has data in the expected columns
4. File size is under 50MB

### Cannot access http://localhost:5000

**Try:**
1. Refresh the browser (Ctrl+R or Cmd+R)
2. Check if Flask is running (terminal should show "Running on...")
3. Try http://127.0.0.1:5000 instead
4. Try a different port if 5000 is busy

### Search returns "No Match Found"

**Check:**
1. Spelling of keywords matches the Short Description
2. All keywords are present (order doesn't matter)
3. Try shorter keywords (e.g., "bol" instead of "bolt")
4. Try searching with fewer keywords

---

## Running in Development vs. Production

### Development (Current Setup)
```bash
python app.py
```
- Debug mode enabled
- Auto-reloads on code changes
- Shows detailed error messages
- Only accessible from your computer

### Production Deployment

For production use, you would need additional setup:

1. **Disable Debug Mode:**
   Edit app.py: `app.run(debug=False, ...)`

2. **Use Production Server:**
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. **Add HTTPS:** Use reverse proxy like nginx

4. **Production Database:** Consider SQLite or PostgreSQL

---

## File Organization

```
DART_SDSE_V1/
├── app.py                   (Main application)
├── requirements.txt         (Dependencies list)
├── README.md               (Full documentation)
├── QUICKSTART.md           (Quick reference)
├── DELIVERY_SUMMARY.md     (What's included)
├── SETUP_INSTRUCTIONS.md   (This file)
├── .gitignore              (Git ignore rules)
│
├── templates/
│   └── index.html          (Web page HTML)
│
├── static/
│   ├── style.css           (Styling)
│   └── script.js           (JavaScript logic)
│
└── uploads/                (Temporary upload folder)
```

---

## Commands Reference

### Starting the App
```bash
python app.py
```

### Stopping the App
Press `Ctrl+C` in the terminal

### Deactivating Virtual Environment
```bash
deactivate
```

### Restarting the App
```bash
Ctrl+C
python app.py
```

### Checking Python Version
```bash
python --version
```

### Checking Installed Packages
```bash
pip list
```

### Reinstalling Dependencies
```bash
pip install -r requirements.txt --force-reinstall
```

---

## File Upload Technical Details

### What Happens When You Upload

1. Flask receives the file
2. Validates file extension (.xlsx)
3. Saves file temporarily to `/uploads` folder
4. Reads Excel file using openpyxl
5. Extracts columns A, B, H, I, O, P from rows 2-200000
6. Filters out empty rows
7. Stores data in memory
8. Returns success message with row count
9. File remains in uploads folder (can be deleted manually)

### File Safety

- Original file is **never modified**
- Only the first 200,000 rows are loaded
- Files are stored in `/uploads` folder
- You can delete files from uploads folder anytime

---

## Performance Tips

1. **Faster Searches:**
   - Use fewer keywords
   - Use partial keywords
   - Example: "bol" instead of "bolt"

2. **Faster Uploads:**
   - Use smaller Excel files if possible
   - Remove unnecessary columns
   - Keep file under 50MB

3. **Better Results:**
   - Ensure Excel file is not corrupted
   - Use exact spelling from Short Description
   - Try different keyword combinations

---

## Browser Settings

### Recommended Settings
- Enable JavaScript (required)
- Allow cookies (for session management)
- No special security settings needed

### Clear Browser Cache (if needed)
- Chrome: Ctrl+Shift+Delete
- Firefox: Ctrl+Shift+Delete
- Safari: Develop menu → Clear Caches
- Edge: Ctrl+Shift+Delete

---

## Getting Help

1. **Check README.md** - Full documentation and FAQ
2. **Check QUICKSTART.md** - Quick reference
3. **Read error messages** - They're designed to help
4. **Review code comments** in app.py
5. **Check browser console** for JavaScript errors (F12)

---

## Next Steps

Once the app is running:

1. ✅ Upload your DART Excel file
2. ✅ Try a simple search (e.g., "bolt")
3. ✅ Try multiple keywords (e.g., "bolt steel")
4. ✅ Try reverse order (e.g., "steel bolt")
5. ✅ Test "Clear" button
6. ✅ Review the results

---

## Important Notes

- **Data Privacy:** All data stays on your computer (no cloud upload)
- **No Database:** Everything is in memory (faster, simpler)
- **No Installation:** Just run python app.py
- **No Registration:** No login or account needed
- **Free to Use:** Open source, made by MUIZZ

---

## Maintenance

### Regular Cleanup
- Delete old files from `/uploads` folder
- Clear browser cache if experiencing issues
- Restart the application weekly

### Updates
- Check for new Python/Flask versions
- Review CHANGELOG (if provided)
- Update dependencies: `pip install -r requirements.txt --upgrade`

---

## Contact & Support

For issues or questions:
1. Review the documentation files
2. Check the error messages
3. Contact MUIZZ for support

---

## License & Credits

**DART-Search V2.0 – Made by MUIZZ**

Built with:
- Flask (Python web framework)
- openpyxl (Excel processing)
- HTML/CSS/JavaScript (Frontend)

---

## Checklist: Ready to Use?

- ✅ Python 3.7+ installed
- ✅ Dependencies installed (`pip install -r requirements.txt`)
- ✅ Application starts (`python app.py`)
- ✅ Browser access (`http://localhost:5000`)
- ✅ Excel file prepared (DART format)
- ✅ Can upload file
- ✅ Can perform search
- ✅ Can view results

If all checked, you're ready to go! 🚀

---

**Last Updated:** January 2025  
**Status:** Ready for Use
