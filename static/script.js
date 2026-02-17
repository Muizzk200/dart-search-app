// DOM Elements
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const rowCount = document.getElementById('rowCount');

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const exportBtn = document.getElementById('exportBtn');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const clearUploadBtn = document.getElementById('clearUploadBtn');
const searchStatus = document.getElementById('searchStatus');
const resultsContainer = document.getElementById('resultsContainer');
const manufacturerFilter = document.getElementById('manufacturerList');
const productDivisionFilter = document.getElementById('productDivisionList');
const salesStatusFilter = document.getElementById('salesStatusList');
const productManagerFilter = document.getElementById('productManagerList');
const subItemFilter = document.getElementById('subItemList');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const manufacturerSearch = document.getElementById('manufacturerSearch');
const productDivisionSearch = document.getElementById('productDivisionSearch');
const salesStatusSearch = document.getElementById('salesStatusSearch');
const productManagerSearch = document.getElementById('productManagerSearch');
const subItemSearch = document.getElementById('subItemSearch');
const materialGroupFilter = document.getElementById('materialGroupList');
const materialGroupDescFilter = document.getElementById('materialGroupDescList');
const materialGroupSearch = document.getElementById('materialGroupSearch');
const materialGroupDescSearch = document.getElementById('materialGroupDescSearch');

let isFileLoaded = false;
// store full options (from uploaded dataset) and current options (based on current search results)
const fullFilterOptions = {
    manufacturers: [],
    product_divisions: [],
    sales_statuses: [],
    product_managers: [],
    sub_items: []
};
const currentFilterOptions = {
    manufacturers: [],
    product_divisions: [],
    sales_statuses: [],
    product_managers: [],
    sub_items: []
};

// include material group options
fullFilterOptions.material_groups = [];
fullFilterOptions.material_group_descs = [];
currentFilterOptions.material_groups = [];
currentFilterOptions.material_group_descs = [];

// File Upload Handler
uploadBtn.addEventListener('click', uploadFile);
fileInput.addEventListener('change', (e) => {
    const name = e.target.files[0]?.name;
    if (name) {
        uploadBtn.textContent = `Upload: ${name}`;
    }
});

async function uploadFile() {
    const file = fileInput.files[0];

    if (!file) {
        showStatus(uploadStatus, 'Please select a file', 'error');
        return;
    }

    // Accept .xlsx and .csv
    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.csv')) {
        showStatus(uploadStatus, 'Only .xlsx and .csv files are allowed', 'error');
        return;
    }

    // Disable button during upload
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    const formData = new FormData();
    formData.append('file', file);

    // Use XMLHttpRequest to report upload progress
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();
        const progressWrap = document.querySelector('.upload-progress');
        const progressBar = document.getElementById('uploadProgress');
        const progressText = document.getElementById('uploadProgressText');

        progressWrap.style.display = 'block';
        progressBar.value = 0;
        progressText.textContent = '0%';

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                progressBar.value = pct;
                progressText.textContent = pct + '%';
            }
        });

        xhr.onreadystatechange = async function () {
            if (xhr.readyState === 4) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload File';
                try {
                    const data = JSON.parse(xhr.responseText || '{}');
                    if (xhr.status >= 200 && xhr.status < 300 && data.success) {
                        showStatus(uploadStatus, data.message, 'success');
                        fileName.textContent = file.name;
                        rowCount.textContent = (data.row_count || 0).toLocaleString();
                        fileInfo.style.display = 'block';
                        isFileLoaded = true;
                        resultsContainer.innerHTML = '<p class="placeholder-text">Ready to search. Enter keywords above.</p>';
                        searchInput.focus();
                        fetchFilters();
                    } else {
                        showStatus(uploadStatus, data.message || 'Upload failed', 'error');
                        isFileLoaded = false;
                        fileInfo.style.display = 'none';
                    }
                } catch (err) {
                    showStatus(uploadStatus, 'Upload failed: ' + err.message, 'error');
                    isFileLoaded = false;
                    fileInfo.style.display = 'none';
                }
                // hide progress after short delay
                setTimeout(() => { progressWrap.style.display = 'none'; }, 800);
                resolve();
            }
        };

        xhr.open('POST', '/upload', true);
        xhr.send(formData);
    });
}

// Search Handler
searchBtn.addEventListener('click', performSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// Export handler
exportBtn?.addEventListener('click', exportResults);

async function performSearch() {
    if (!isFileLoaded) {
        showStatus(searchStatus, 'Please upload a file first', 'error');
        return;
    }
    
    const keywords = searchInput.value.trim();
    // allow searching by filters alone (check multi-select selections)
    // check if any checkbox is selected in the filter lists
    const hasFilters = (manufacturerFilter && manufacturerFilter.querySelectorAll('input[type="checkbox"]:checked').length > 0)
        || (productDivisionFilter && productDivisionFilter.querySelectorAll('input[type="checkbox"]:checked').length > 0)
        || (salesStatusFilter && salesStatusFilter.querySelectorAll('input[type="checkbox"]:checked').length > 0)
        || (productManagerFilter && productManagerFilter.querySelectorAll('input[type="checkbox"]:checked').length > 0)
        || (subItemFilter && subItemFilter.querySelectorAll('input[type="checkbox"]:checked').length > 0)
        || (materialGroupFilter && materialGroupFilter.querySelectorAll('input[type="checkbox"]:checked').length > 0)
        || (materialGroupDescFilter && materialGroupDescFilter.querySelectorAll('input[type="checkbox"]:checked').length > 0);

    if (!keywords && !hasFilters) {
        showStatus(searchStatus, 'Please enter search keywords or apply filters', 'info');
        return;
    }
    
    searchBtn.disabled = true;
    searchBtn.textContent = 'Searching...';
    
    try {
        // gather filters from checkbox lists (arrays)
        const checkboxValues = listEl => {
            if (!listEl) return [];
            return Array.from(listEl.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
        };
        const filters = {
            manufacturer: checkboxValues(manufacturerFilter),
            product_division: checkboxValues(productDivisionFilter),
            sales_status: checkboxValues(salesStatusFilter),
            product_manager: checkboxValues(productManagerFilter),
            sub_item: checkboxValues(subItemFilter),
            material_group: checkboxValues(materialGroupFilter),
            material_group_desc: checkboxValues(materialGroupDescFilter)
        };

        const response = await fetch('/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ keywords, filters })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.no_match || data.results.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="no-match-message">
                        ❌ No Match Found
                    </div>
                `;
                showStatus(searchStatus, 'No Match Found', 'info');
                // update filters to be empty (no results)
                updateFiltersFromResults([]);
            } else {
                displayResults(data.results, keywords);
                showStatus(searchStatus, `Found ${data.count} result(s)`, 'success');
                // update filter options to reflect only values present in search results
                updateFiltersFromResults(data.results);
            }
        } else {
            showStatus(searchStatus, data.message, 'error');
            resultsContainer.innerHTML = '<p class="placeholder-text">Search failed. Please try again.</p>';
        }
    } catch (error) {
        showStatus(searchStatus, 'Search failed: ' + error.message, 'error');
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = 'Search';
    }
}

async function exportResults() {
    if (!isFileLoaded) {
        showStatus(searchStatus, 'Please upload a file first', 'error');
        return;
    }

    exportBtn.disabled = true;
    exportBtn.textContent = 'Preparing...';

    try {
        const checkboxValues = listEl => {
            if (!listEl) return [];
            return Array.from(listEl.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
        };
        const filters = {
            manufacturer: checkboxValues(manufacturerFilter),
            product_division: checkboxValues(productDivisionFilter),
            sales_status: checkboxValues(salesStatusFilter),
            product_manager: checkboxValues(productManagerFilter),
            sub_item: checkboxValues(subItemFilter),
            material_group: checkboxValues(materialGroupFilter),
            material_group_desc: checkboxValues(materialGroupDescFilter)
        };

        const keywords = searchInput.value.trim();

        const res = await fetch('/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keywords, filters })
        });

        if (!res.ok) {
            let data = {};
            try { data = await res.json(); } catch (e) {}
            showStatus(searchStatus, data.message || 'Export failed', 'error');
            return;
        }

        const blob = await res.blob();
        // try to get filename from header
        const disp = res.headers.get('Content-Disposition') || '';
        let filename = 'search_results.xlsx';
        const fnMatch = /filename\*?=([^;]+)/i.exec(disp);
        if (fnMatch) {
            filename = fnMatch[1].replace(/UTF-8''/, '').replace(/"/g, '').trim();
            try { filename = decodeURIComponent(filename); } catch (e) {}
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        showStatus(searchStatus, 'Export started — your download should begin shortly', 'success');
    } catch (err) {
        showStatus(searchStatus, 'Export failed: ' + err.message, 'error');
    } finally {
        exportBtn.disabled = false;
        exportBtn.textContent = 'Export';
    }
}


// Fetch filter options from server and populate selects
async function fetchFilters() {
    try {
        const res = await fetch('/filters');
        const data = await res.json();
        if (res.ok && data.filters) {
            // store full options and initialize current options
            fullFilterOptions.manufacturers = data.filters.manufacturers || [];
            fullFilterOptions.product_divisions = data.filters.product_divisions || [];
            fullFilterOptions.sales_statuses = data.filters.sales_statuses || [];
            fullFilterOptions.product_managers = data.filters.product_managers || [];
            fullFilterOptions.sub_items = data.filters.sub_items || [];
            fullFilterOptions.material_groups = data.filters.material_groups || [];
            fullFilterOptions.material_group_descs = data.filters.material_group_descs || [];

            // initialize current options to full options
            currentFilterOptions.manufacturers = [...fullFilterOptions.manufacturers];
            currentFilterOptions.product_divisions = [...fullFilterOptions.product_divisions];
            currentFilterOptions.sales_statuses = [...fullFilterOptions.sales_statuses];
            currentFilterOptions.product_managers = [...fullFilterOptions.product_managers];
            currentFilterOptions.sub_items = [...fullFilterOptions.sub_items];
            currentFilterOptions.material_groups = [...fullFilterOptions.material_groups];
            currentFilterOptions.material_group_descs = [...fullFilterOptions.material_group_descs];

            // populate checkbox lists
            populateCheckboxList(manufacturerFilter, currentFilterOptions.manufacturers, 'manufacturer');
            populateCheckboxList(productDivisionFilter, currentFilterOptions.product_divisions, 'product_division');
            populateCheckboxList(salesStatusFilter, currentFilterOptions.sales_statuses, 'sales_status');
            populateCheckboxList(productManagerFilter, currentFilterOptions.product_managers, 'product_manager');
            populateCheckboxList(subItemFilter, currentFilterOptions.sub_items, 'sub_item');
            populateCheckboxList(materialGroupFilter, currentFilterOptions.material_groups, 'material_group');
            populateCheckboxList(materialGroupDescFilter, currentFilterOptions.material_group_descs, 'material_group_desc');

            // attach search handlers for each filter-search input
            attachCheckboxFilterSearch(manufacturerSearch, manufacturerFilter, 'manufacturers');
            attachCheckboxFilterSearch(productDivisionSearch, productDivisionFilter, 'product_divisions');
            attachCheckboxFilterSearch(salesStatusSearch, salesStatusFilter, 'sales_statuses');
            attachCheckboxFilterSearch(productManagerSearch, productManagerFilter, 'product_managers');
            attachCheckboxFilterSearch(subItemSearch, subItemFilter, 'sub_items');
            attachCheckboxFilterSearch(materialGroupSearch, materialGroupFilter, 'material_groups');
            attachCheckboxFilterSearch(materialGroupDescSearch, materialGroupDescFilter, 'material_group_descs');
        }
    } catch (err) {
        console.warn('Failed to load filters', err);
    }
}

function populateSelect(selectEl, items, placeholder) {
    if (!selectEl) return;
    // preserve previous selected values (for multi-selects)
    const prevSelected = Array.from(selectEl.selectedOptions || []).map(o => o.value);
    selectEl.innerHTML = '';
    // for multi-selects we add a disabled placeholder
    const placeholderOption = document.createElement('option');
    placeholderOption.value = '';
    placeholderOption.textContent = placeholder || '-- All --';
    placeholderOption.disabled = true;
    selectEl.appendChild(placeholderOption);
    items.forEach(i => {
        const o = document.createElement('option');
        o.value = i;
        o.textContent = i;
        // restore if previously selected
        if (prevSelected.includes(String(i))) o.selected = true;
        selectEl.appendChild(o);
    });
    // if nothing selected, ensure placeholder is not selected
    if (!selectEl.selectedOptions.length) {
        // keep placeholder unselected; no selection means all
    }
}

// Populate a checkbox list container with items. listEl is a div.
function populateCheckboxList(listEl, items, key) {
    if (!listEl) return;
    // remember checked values
    const prevChecked = Array.from(listEl.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
    listEl.innerHTML = '';
    if (!items || items.length === 0) {
        listEl.innerHTML = '<div class="no-options">—</div>';
        return;
    }
    items.forEach(val => {
        const id = `chk-${key}-${String(val).replace(/[^a-z0-9_-]/gi, '_')}`;
        const wrapper = document.createElement('label');
        wrapper.className = 'checkbox-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.value = val;
        cb.id = id;
        if (prevChecked.includes(String(val))) cb.checked = true;
        const span = document.createElement('span');
        span.textContent = val;
        wrapper.appendChild(cb);
        wrapper.appendChild(span);
        listEl.appendChild(wrapper);
    });
}

function attachCheckboxFilterSearch(searchInputEl, listEl, key) {
    if (!searchInputEl || !listEl) return;
    searchInputEl.addEventListener('input', (e) => {
        const q = String(e.target.value || '').toLowerCase().trim();
        const items = currentFilterOptionsMap(key);
        const filtered = q ? items.filter(s => String(s).toLowerCase().includes(q)) : items;
        populateCheckboxList(listEl, filtered, key);
    });
}

function attachFilterSearch(searchInputEl, selectEl, key) {
    if (!searchInputEl || !selectEl) return;
    // on input, filter currentFilterOptions[key] and repopulate
    searchInputEl.addEventListener('input', (e) => {
        const q = String(e.target.value || '').toLowerCase().trim();
        const source = currentFilterOptionsMap(key);
        const filtered = q ? source.filter(s => String(s).toLowerCase().includes(q)) : source;
        populateSelect(selectEl, filtered, selectEl.options[0]?.text || '-- All --');
    });
}

function currentFilterOptionsMap(key) {
    switch (key) {
        case 'manufacturers': return currentFilterOptions.manufacturers;
        case 'product_divisions': return currentFilterOptions.product_divisions;
        case 'sales_statuses': return currentFilterOptions.sales_statuses;
        case 'product_managers': return currentFilterOptions.product_managers;
        case 'sub_items': return currentFilterOptions.sub_items;
        case 'material_groups': return currentFilterOptions.material_groups;
        case 'material_group_descs': return currentFilterOptions.material_group_descs;
        default: return [];
    }
}

resetFiltersBtn?.addEventListener('click', () => {
    // clear checkbox selections
    if (manufacturerFilter) Array.from(manufacturerFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (productDivisionFilter) Array.from(productDivisionFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (salesStatusFilter) Array.from(salesStatusFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (productManagerFilter) Array.from(productManagerFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (subItemFilter) Array.from(subItemFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (materialGroupFilter) Array.from(materialGroupFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (materialGroupDescFilter) Array.from(materialGroupDescFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    showStatus(searchStatus, 'Filters reset', 'info');
    // reset current options to full options
    currentFilterOptions.manufacturers = [...fullFilterOptions.manufacturers];
    currentFilterOptions.product_divisions = [...fullFilterOptions.product_divisions];
    currentFilterOptions.sales_statuses = [...fullFilterOptions.sales_statuses];
    currentFilterOptions.product_managers = [...fullFilterOptions.product_managers];
    currentFilterOptions.sub_items = [...fullFilterOptions.sub_items];
    currentFilterOptions.material_groups = [...fullFilterOptions.material_groups];
    currentFilterOptions.material_group_descs = [...fullFilterOptions.material_group_descs];
    populateCheckboxList(manufacturerFilter, currentFilterOptions.manufacturers, 'manufacturer');
    populateCheckboxList(productDivisionFilter, currentFilterOptions.product_divisions, 'product_division');
    populateCheckboxList(salesStatusFilter, currentFilterOptions.sales_statuses, 'sales_status');
    populateCheckboxList(productManagerFilter, currentFilterOptions.product_managers, 'product_manager');
    populateCheckboxList(subItemFilter, currentFilterOptions.sub_items, 'sub_item');
    populateCheckboxList(materialGroupFilter, currentFilterOptions.material_groups, 'material_group');
    populateCheckboxList(materialGroupDescFilter, currentFilterOptions.material_group_descs, 'material_group_desc');
});

function displayResults(results, keywords) {
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="placeholder-text">No results found</p>';
        return;
    }
    
    // Highlight keywords in description
    const highlightText = (text, keywords) => {
        if (!text) return text;
        const searchWords = keywords.toLowerCase().split(' ');
        let highlightedText = String(text);
        
        searchWords.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
        });
        
        return highlightedText;
    };
    
    const html = `
        <div class="result-count">
            Total Results: <strong>${results.length}</strong>
        </div>
        <table class="results-table">
            <thead>
                <tr>
                    <th>Item No</th>
                    <th>Description</th>
                    <th>Product Division</th>
                        <th>Material Group</th>
                        <th>Material Group Desc</th>
                    <th>Manufacturer Name</th>
                    <th>Manufacturer Item No</th>
                    <th>Sales Status</th>
                    <th>Product Manager</th>
                    <th>Sub Item</th>
                </tr>
            </thead>
            <tbody>
                ${results.map(row => `
                    <tr>
                        <td>${escapeHtml(row.item_no) || '-'}</td>
                        <td>${highlightText(row.description, keywords)}</td>
                                <td>${escapeHtml(row.product_division) || '-'}</td>
                                <td>${escapeHtml(row.material_group) || '-'}</td>
                                <td>${escapeHtml(row.material_group_desc) || '-'}</td>
                                <td>${escapeHtml(row.manufacturer_name) || '-'}</td>
                        <td>${escapeHtml(row.manufacturer_item_no) || '-'}</td>
                        <td>${escapeHtml(row.sales_status) || '-'}</td>
                        <td>${escapeHtml(row.product_manager) || '-'}</td>
                        <td>${escapeHtml(row.sub_item) || '-'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    resultsContainer.innerHTML = html;
}

function updateFiltersFromResults(results) {
    // compute unique sets from results
    const mset = new Set();
    const pdset = new Set();
    const ssset = new Set();
    const pmset = new Set();
    const siset = new Set();
    const mgset = new Set();
    const mgdset = new Set();

    results.forEach(r => {
        if (r.manufacturer_name) mset.add(String(r.manufacturer_name).trim());
        if (r.product_division) pdset.add(String(r.product_division).trim());
        if (r.sales_status) ssset.add(String(r.sales_status).trim());
        else ssset.add('(blank)');
        if (r.product_manager) pmset.add(String(r.product_manager).trim());
        if (r.sub_item) siset.add(String(r.sub_item).trim());
        if (r.material_group) mgset.add(String(r.material_group).trim());
        if (r.material_group_desc) mgdset.add(String(r.material_group_desc).trim());
    });

    currentFilterOptions.manufacturers = Array.from(mset).sort();
    currentFilterOptions.product_divisions = Array.from(pdset).sort();
    currentFilterOptions.sales_statuses = Array.from(ssset).sort();
    currentFilterOptions.product_managers = Array.from(pmset).sort();
    currentFilterOptions.sub_items = Array.from(siset).sort();
    currentFilterOptions.material_groups = Array.from(mgset).sort();
    currentFilterOptions.material_group_descs = Array.from(mgdset).sort();

    // populate checkbox lists and preserve checked boxes where possible
    const prevChecked = sel => sel ? Array.from(sel.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value) : [];
    const prevM = prevChecked(manufacturerFilter);
    const prevPD = prevChecked(productDivisionFilter);
    const prevSS = prevChecked(salesStatusFilter);
    const prevPM = prevChecked(productManagerFilter);
    const prevSI = prevChecked(subItemFilter);
    const prevMG = prevChecked(materialGroupFilter);
    const prevMGD = prevChecked(materialGroupDescFilter);

    populateCheckboxList(manufacturerFilter, currentFilterOptions.manufacturers, 'manufacturer');
    populateCheckboxList(productDivisionFilter, currentFilterOptions.product_divisions, 'product_division');
    populateCheckboxList(salesStatusFilter, currentFilterOptions.sales_statuses, 'sales_status');
    populateCheckboxList(productManagerFilter, currentFilterOptions.product_managers, 'product_manager');
    populateCheckboxList(subItemFilter, currentFilterOptions.sub_items, 'sub_item');
    populateCheckboxList(materialGroupFilter, currentFilterOptions.material_groups, 'material_group');
    populateCheckboxList(materialGroupDescFilter, currentFilterOptions.material_group_descs, 'material_group_desc');

    // restore previously checked where still present
    const restore = (listEl, prev) => {
        if (!listEl) return;
        Array.from(listEl.querySelectorAll('input[type="checkbox"]')).forEach(cb => {
            if (prev.includes(cb.value)) cb.checked = true;
        });
    };
    restore(manufacturerFilter, prevM);
    restore(productDivisionFilter, prevPD);
    restore(salesStatusFilter, prevSS);
    restore(productManagerFilter, prevPM);
    restore(subItemFilter, prevSI);
    restore(materialGroupFilter, prevMG);
    restore(materialGroupDescFilter, prevMGD);
}

// Clear Handler
// Clear Search: clears search text, results, and unchecks filters (client-side only)
clearSearchBtn?.addEventListener('click', () => {
    // clear search box
    if (searchInput) searchInput.value = '';
    // clear results
    if (resultsContainer) resultsContainer.innerHTML = '<p class="placeholder-text">Ready to search. Enter keywords above.</p>';
    // clear status
    if (searchStatus) {
        searchStatus.classList.remove('success', 'error', 'info');
        searchStatus.style.display = 'none';
        searchStatus.textContent = '';
    }
    // uncheck filter checkboxes
    if (manufacturerFilter) Array.from(manufacturerFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (productDivisionFilter) Array.from(productDivisionFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (salesStatusFilter) Array.from(salesStatusFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (productManagerFilter) Array.from(productManagerFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (subItemFilter) Array.from(subItemFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (materialGroupFilter) Array.from(materialGroupFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    if (materialGroupDescFilter) Array.from(materialGroupDescFilter.querySelectorAll('input[type="checkbox"]')).forEach(cb => cb.checked = false);
    showStatus(searchStatus, 'Search cleared', 'info');
});

// Clear Upload: clear uploaded file on server and reset UI
clearUploadBtn?.addEventListener('click', async () => {
    try {
        const res = await fetch('/clear', { method: 'POST' });
        if (res.ok) {
            // reset UI
            isFileLoaded = false;
            if (fileInfo) fileInfo.style.display = 'none';
            if (fileName) fileName.textContent = '';
            if (rowCount) rowCount.textContent = '';
            if (resultsContainer) resultsContainer.innerHTML = '<p class="placeholder-text">Upload a file and search to see results here</p>';
            // clear filters and options
            fullFilterOptions.manufacturers = [];
            fullFilterOptions.product_divisions = [];
            fullFilterOptions.sales_statuses = [];
            fullFilterOptions.product_managers = [];
            fullFilterOptions.sub_items = [];
            fullFilterOptions.material_groups = [];
            fullFilterOptions.material_group_descs = [];
            currentFilterOptions.manufacturers = [];
            currentFilterOptions.product_divisions = [];
            currentFilterOptions.sales_statuses = [];
            currentFilterOptions.product_managers = [];
            currentFilterOptions.sub_items = [];
            currentFilterOptions.material_groups = [];
            currentFilterOptions.material_group_descs = [];
            populateCheckboxList(manufacturerFilter, [], 'manufacturer');
            populateCheckboxList(productDivisionFilter, [], 'product_division');
            populateCheckboxList(salesStatusFilter, [], 'sales_status');
            populateCheckboxList(productManagerFilter, [], 'product_manager');
            populateCheckboxList(subItemFilter, [], 'sub_item');
            populateCheckboxList(materialGroupFilter, [], 'material_group');
            populateCheckboxList(materialGroupDescFilter, [], 'material_group_desc');
            showStatus(uploadStatus, 'Upload cleared. Ready for new upload.', 'success');
        } else {
            showStatus(uploadStatus, 'Failed to clear upload', 'error');
        }
    } catch (err) {
        console.error('Clear upload failed', err);
        showStatus(uploadStatus, 'Clear upload failed', 'error');
    }
});

// Utility Functions
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Add CSS for highlighting
const style = document.createElement('style');
style.textContent = `
    mark {
        background-color: #fff3cd;
        padding: 2px 4px;
        border-radius: 2px;
        font-weight: 600;
        color: #856404;
    }
`;
document.head.appendChild(style);

// Initial message
window.addEventListener('load', () => {
    showStatus(uploadStatus, 'Upload an Excel file to begin', 'info');
});
