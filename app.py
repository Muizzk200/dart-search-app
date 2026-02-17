from flask import Flask, render_template, request, jsonify, send_file
import io
import openpyxl
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size
ALLOWED_EXTENSIONS = {'xlsx', 'csv'}
BLANK_LABEL = '(blank)'

# Store loaded data in memory
loaded_data = {
    'rows': [],
    'filename': None
}

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def build_header_index(header_row):
    """
    Build a dynamic header → column index mapping from the first row.
    Only 'description' is mandatory. Missing columns are mapped to -1.
    
    Args:
        header_row: List of header values from row 1
        
    Returns:
        tuple: (header_index dict, error_message)
        - header_index: dict mapping normalized header names to column indices (-1 if missing)
        - error_message: None if successful, error string if description column is missing
        
    Example:
        header_index = {
            'item': 0,
            'description': 1,
            'product division': 5,
            'product mgr': -1,  # missing column
            ...
        }
    """
    EXPECTED_HEADERS = [
        'item',
        'description',
        'product division',
        'sales status',
        'mfr name',
        'mfr item',
        'sub item',
        'product mgr',
        'material group',
        'material group desc'
    ]
    
    # Build normalized header map (lowercase, stripped)
    header_index = {}
    for idx, header in enumerate(header_row):
        if header is not None:
            normalized = str(header).strip().lower()
            header_index[normalized] = idx
    
    # Check if description column exists (only mandatory column)
    if 'description' not in header_index:
        return None, "Missing required 'Description' column"
    
    # Add missing expected columns with -1 index to indicate they don't exist
    for expected_header in EXPECTED_HEADERS:
        if expected_header not in header_index:
            header_index[expected_header] = -1
    
    return header_index, None

def parse_excel_file(filepath):
    """
    Parse Excel file and extract data from DART sheet using header-based column mapping.
    
    Column headers are read from row 1 and normalized (stripped, lowercased).
    All data extraction uses the dynamic header_index mapping instead of fixed column positions.
    
    Expected headers (case-insensitive):
    - Item
    - Description
    - Product Division
    - Sales Status
    - Mfr Name
    - Mfr Item
    - Sub Item
    - Product Mgr
    """
    try:
        # Use read_only to reduce memory usage and speed up large files
        workbook = openpyxl.load_workbook(filepath, read_only=True, data_only=True)

        # Try to find 'DART' sheet, fallback to first sheet
        if 'DART' in workbook.sheetnames:
            worksheet = workbook['DART']
        else:
            worksheet = workbook.active

        # Read header row (row 1)
        header_row = None
        for idx, row in enumerate(worksheet.iter_rows(min_row=1, max_row=1, values_only=True)):
            header_row = row
            break
        
        if not header_row:
            return [], "No header row found in Excel file"
        
        # Build header → index mapping and validate required headers exist
        header_index, error = build_header_index(header_row)
        if error:
            return [], error

        rows = []
        # Process data rows starting from row 2
        # We now read all columns since we use header-based indexing
        for row in worksheet.iter_rows(min_row=2, values_only=True):
            try:
                # Skip empty rows (check if description is empty)
                desc_idx = header_index['description']
                short_desc = row[desc_idx] if len(row) > desc_idx else None
                if not short_desc or not str(short_desc).strip():
                    continue
                
                # Helper function to safely extract column values
                def get_col_value(col_name):
                    idx = header_index[col_name]
                    if idx == -1:  # Column doesn't exist
                        return None
                    return row[idx] if len(row) > idx else None
                
                # Extract values using header-based index mapping
                # Handle missing columns gracefully by returning None
                item_no = get_col_value('item')
                product_div = get_col_value('product division')
                material_group = get_col_value('material group')
                material_group_desc = get_col_value('material group desc')
                mfg_name = get_col_value('mfr name')
                mfg_item_no = get_col_value('mfr item')
                sales_status = get_col_value('sales status')
                product_manager = get_col_value('product mgr')
                sub_item = get_col_value('sub item')

                rows.append({
                    'item_no': item_no,
                    'description': short_desc,
                    'product_division': product_div,
                    'material_group': material_group,
                    'material_group_desc': material_group_desc,
                    'manufacturer_name': mfg_name,
                    'manufacturer_item_no': mfg_item_no,
                    'sales_status': sales_status,
                    'product_manager': product_manager,
                    'sub_item': sub_item
                })
            except (IndexError, TypeError):
                continue

        workbook.close()
        return rows, None

    except Exception as e:
        return [], f"Error parsing file: {str(e)}"


def parse_csv_file(filepath):
    """
    Parse a CSV file using header-based column mapping.
    
    The first row is treated as headers and normalized (stripped, lowercased).
    All data extraction uses the dynamic header_index mapping.
    
    Expected headers (case-insensitive):
    - Item
    - Description
    - Product Division
    - Sales Status
    - Mfr Name
    - Mfr Item
    - Sub Item
    - Product Mgr
    """
    import csv

    rows = []
    try:
        with open(filepath, newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            
            # Read header row (first row)
            header_row = next(reader, None)
            if not header_row:
                return [], "No header row found in CSV file"
            
            # Build header → index mapping and validate required headers exist
            header_index, error = build_header_index(header_row)
            if error:
                return [], error
            
            # Process data rows
            for r in reader:
                try:
                    # Skip empty rows (check if description is empty)
                    desc_idx = header_index['description']
                    short_desc = r[desc_idx] if len(r) > desc_idx else None
                    if not short_desc or not str(short_desc).strip():
                        continue
                    
                    # Helper function to safely extract column values
                    def get_col_value(col_name):
                        idx = header_index[col_name]
                        if idx == -1:  # Column doesn't exist
                            return None
                        return r[idx] if len(r) > idx else None
                    
                    # Extract values using header-based index mapping
                    # Handle missing columns gracefully by returning None
                    item_no = get_col_value('item')
                    product_div = get_col_value('product division')
                    material_group = get_col_value('material group')
                    material_group_desc = get_col_value('material group desc')
                    mfg_name = get_col_value('mfr name')
                    mfg_item_no = get_col_value('mfr item')
                    sales_status = get_col_value('sales status')
                    product_manager = get_col_value('product mgr')
                    sub_item = get_col_value('sub item')

                    rows.append({
                        'item_no': item_no,
                        'description': short_desc,
                        'product_division': product_div,
                        'material_group': material_group,
                        'material_group_desc': material_group_desc,
                        'manufacturer_name': mfg_name,
                        'manufacturer_item_no': mfg_item_no,
                        'sales_status': sales_status,
                        'product_manager': product_manager,
                        'sub_item': sub_item
                    })
                except Exception:
                    continue
        
        return rows, None
    except Exception as e:
        return [], f"Error parsing CSV file: {str(e)}"


def _compute_filters(rows):
    """Compute unique filter options from parsed rows."""
    manufacturers = set()
    product_divs = set()
    sales_statuses = set()
    product_managers = set()
    sub_items = set()
    material_groups = set()
    material_group_descs = set()

    for r in rows:
        if r.get('manufacturer_name'):
            manufacturers.add(str(r['manufacturer_name']).strip())
        if r.get('product_division'):
            product_divs.add(str(r['product_division']).strip())
        # Treat empty / missing sales status as a special '(blank)' option
        if r.get('sales_status') is not None and str(r['sales_status']).strip() != '':
            sales_statuses.add(str(r['sales_status']).strip())
        else:
            sales_statuses.add(BLANK_LABEL)
        if r.get('product_manager'):
            product_managers.add(str(r['product_manager']).strip())
        if r.get('sub_item'):
            sub_items.add(str(r['sub_item']).strip())
        if r.get('material_group'):
            material_groups.add(str(r['material_group']).strip())
        if r.get('material_group_desc'):
            material_group_descs.add(str(r['material_group_desc']).strip())

    return {
        'manufacturers': sorted([m for m in manufacturers if m]),
        'product_divisions': sorted([p for p in product_divs if p]),
        'sales_statuses': sorted([s for s in sales_statuses if s]),
        'product_managers': sorted([pm for pm in product_managers if pm]),
        'sub_items': sorted([si for si in sub_items if si]),
        'material_groups': sorted([mg for mg in material_groups if mg]),
        'material_group_descs': sorted([mgd for mgd in material_group_descs if mgd])
    }

def search_rows(keywords, rows):
    """
    Search rows by Description and Item No fields (case-insensitive, partial matches allowed).
    
    Matching Rule:
    ALL keywords must be found in EITHER:
      - Description field, OR
      - Item No field
    
    Keywords cannot be split across fields. Each field is evaluated independently.
    
    Examples:
      Item: A12345-B, Description: "Steel Hex Bolt"
      Search: "A123"        → MATCH (found in Item)
      Search: "steel bolt"  → MATCH (found in Description)
      Search: "A123 bolt"   → NO MATCH (keywords split across fields)
    """
    if not keywords or not keywords.strip():
        return []
    
    # Split keywords and convert to lowercase
    search_words = keywords.lower().split()
    
    if not search_words:
        return []
    
    results = []
    
    for row in rows:
        # Collect searchable text fields (converted to lowercase)
        # Description and Item No are the searchable fields
        searchable_texts = [
            str(row['description']).lower() if row['description'] else '',
            str(row['item_no']).lower() if row['item_no'] else ''
        ]
        
        # Check if ALL search words are found in any single field (OR-based field matching)
        # A row matches if all keywords appear in Description OR all keywords appear in Item No
        match_found = any(
            all(word in text for word in search_words)
            for text in searchable_texts
        )
        
        if match_found:
            results.append(row)
    
    return results

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """Handle file upload"""
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'message': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'success': False, 'message': 'Only .xlsx files are allowed'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        
        # Ensure uploads folder exists
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Parse file depending on extension
        ext = filename.rsplit('.', 1)[1].lower()
        if ext == 'csv':
            rows, error = parse_csv_file(filepath)
        else:
            rows, error = parse_excel_file(filepath)
        
        if error:
            return jsonify({'success': False, 'message': error}), 400
        
        # Store in memory and compute filter options
        loaded_data['rows'] = rows
        loaded_data['filename'] = filename
        loaded_data['filters'] = _compute_filters(rows)
        
        return jsonify({
            'success': True,
            'message': f'File "{filename}" uploaded successfully! ({len(rows)} rows loaded)',
            'row_count': len(rows)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'message': f'Upload failed: {str(e)}'}), 500


@app.route('/filters', methods=['GET'])
def get_filters():
    """Return computed filter options for the currently loaded file."""
    if not loaded_data.get('rows'):
        return jsonify({'success': False, 'message': 'No file loaded', 'filters': {}}), 400

    return jsonify({'success': True, 'filters': loaded_data.get('filters', {})})


def _apply_filters(rows, filters):
    """Filter rows by provided filter values. Filters are strings or empty."""
    if not filters:
        return rows
    # Filters can be single string or list of strings. When list: match any (OR) within that filter.
    mf = filters.get('manufacturer')
    pd = filters.get('product_division')
    ss = filters.get('sales_status')
    pm = filters.get('product_manager')
    si = filters.get('sub_item')
    mg = filters.get('material_group')
    mgd = filters.get('material_group_desc')

    def _matches_value(row_val, filter_val):
        if not filter_val:
            return True
        def _is_blank(v):
            return v is None or str(v).strip() == ''

        # If filter is a list, match any item in the list (OR). Support special '(blank)' token.
        if isinstance(filter_val, (list, tuple)):
            for f in filter_val:
                if f is None:
                    continue
                fstr = str(f).strip()
                if fstr == BLANK_LABEL and _is_blank(row_val):
                    return True
                if (row_val is not None) and str(row_val).strip() == fstr:
                    return True
            return False

        # Single filter value
        fstr = str(filter_val).strip()
        if fstr == BLANK_LABEL:
            return _is_blank(row_val)
        if row_val is None:
            return False
        return str(row_val).strip() == fstr

    def matches(row):
        if not _matches_value(row.get('manufacturer_name'), mf):
            return False
        if not _matches_value(row.get('product_division'), pd):
            return False
        if not _matches_value(row.get('sales_status'), ss):
            return False
        if not _matches_value(row.get('material_group'), mg):
            return False
        if not _matches_value(row.get('material_group_desc'), mgd):
            return False
        if not _matches_value(row.get('product_manager'), pm):
            return False
        if not _matches_value(row.get('sub_item'), si):
            return False
        return True

    return [r for r in rows if matches(r)]

@app.route('/search', methods=['POST'])
def search():
    """Handle search request"""
    try:
        if not loaded_data['rows']:
            return jsonify({
                'success': False,
                'message': 'No file loaded. Please upload a file first.',
                'results': []
            }), 400
        
        data = request.get_json() or {}
        keywords = data.get('keywords', '').strip()
        filters = data.get('filters', {})

        # Apply filters first (if any)
        filtered_rows = _apply_filters(loaded_data['rows'], filters)

        # If keywords provided, perform keyword search on filtered rows
        if keywords:
            results = search_rows(keywords, filtered_rows)
        else:
            # No keywords => return filtered rows (or message prompting keywords if no filters)
            if filters:
                results = filtered_rows
            else:
                return jsonify({
                    'success': True,
                    'message': 'Please enter search keywords or apply filters',
                    'results': [],
                    'count': 0
                })
        
        if not results:
            return jsonify({
                'success': True,
                'message': 'No Match Found',
                'results': [],
                'count': 0,
                'no_match': True
            })
        
        return jsonify({
            'success': True,
            'message': f'Found {len(results)} result(s)',
            'results': results,
            'count': len(results)
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Search failed: {str(e)}',
            'results': []
        }), 500


@app.route('/export', methods=['POST'])
def export_results():
    """Export search results (same logic as /search) to an Excel file and return as attachment."""
    try:
        if not loaded_data['rows']:
            return jsonify({'success': False, 'message': 'No file loaded. Please upload a file first.'}), 400

        data = request.get_json() or {}
        keywords = data.get('keywords', '').strip()
        filters = data.get('filters', {})

        # Apply filters
        filtered_rows = _apply_filters(loaded_data['rows'], filters)

        # Apply keyword search if provided
        if keywords:
            results = search_rows(keywords, filtered_rows)
        else:
            if filters:
                results = filtered_rows
            else:
                return jsonify({'success': False, 'message': 'Please enter search keywords or apply filters to export.'}), 400

        if not results:
            return jsonify({'success': True, 'message': 'No Match Found', 'results': [], 'count': 0}), 200

        # Create an Excel workbook in-memory
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = 'Search Results'

        headers = ['Item No', 'Description', 'Product Division', 'Material Group', 'Material Group Desc', 'Manufacturer Name', 'Manufacturer Item No', 'Sales Status', 'Product Manager', 'Sub Item']
        ws.append(headers)

        for r in results:
            ws.append([
                r.get('item_no'),
                r.get('description'),
                r.get('product_division'),
                r.get('material_group'),
                r.get('material_group_desc'),
                r.get('manufacturer_name'),
                r.get('manufacturer_item_no'),
                r.get('sales_status'),
                r.get('product_manager'),
                r.get('sub_item')
            ])

        bio = io.BytesIO()
        wb.save(bio)
        bio.seek(0)

        filename = 'search_results.xlsx'
        # Return file as attachment
        return send_file(bio,
                 as_attachment=True,
                 download_name=filename,
                 mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    except Exception as e:
        return jsonify({'success': False, 'message': f'Export failed: {str(e)}'}), 500

@app.route('/clear', methods=['POST'])
def clear():
    """Clear loaded file and search results"""
    loaded_data['rows'] = []
    loaded_data['filename'] = None
    return jsonify({'success': True, 'message': 'Data cleared. Ready for new upload.'})

if __name__ == '__main__':
    # Create uploads folder if it doesn't exist
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=5000)
