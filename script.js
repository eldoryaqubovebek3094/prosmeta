// Ilova konfiguratsiyasi
const PROFESSIONS = {
    plumbing: { title: "Santexnika", file: "plumbing.json", color: "#0d6efd" },
    carpentry: { title: "Yog'och va Taxta", file: "carpentry.json", color: "#8b4513" },
    painting: { title: "Malyarka va Pardozlash", file: "painting.json", color: "#6f42c1" },
    electrical: { title: "Elektr montaj", file: "electrical.json", color: "#ffc107" },
    concrete: { title: "Betonchilik", file: "concrete.json", color: "#6c757d" },
    plastering: { title: "Suvoqchilik", file: "plastering.json", color: "#28a745" },
    bricklaying: { title: "Devor qurish va G'isht terish", file: "bricklaying.json", color: "#e44d26" }
};

let currentProfession = localStorage.getItem('currentProfession') || 'plumbing';
// Removed currentLang as only Uzbek is kept
let allMaterials = [];
let selectedQuantities = {};
let selectedPrices = {};

// 1. Bugungi sanani o'rnatish va Mavzu boshqaruvi
document.getElementById('currentDate').innerText = new Date().toLocaleDateString('uz-UZ');

const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    themeToggle.innerText = '☀️';
    themeToggle.className = 'btn btn-light';
}

themeToggle.addEventListener('click', () => {
    let theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        themeToggle.innerText = '🌙';
        themeToggle.className = 'btn btn-dark';
        localStorage.setItem('theme', 'light');
    } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggle.innerText = '☀️';
        themeToggle.className = 'btn btn-light';
        localStorage.setItem('theme', 'dark');
    }
});

// Removed applyLanguage function and language selector event listener

// 2. Ilovani ishga tushirish
function initApp() {
    const prof = PROFESSIONS[currentProfession];
    
    document.getElementById('mainTitle').innerText = `${prof.title} Materiallari Smetasini Shakllantirish`;
    document.getElementById('mainTitle').style.color = prof.color;
    document.getElementById('liveTotalSum').style.backgroundColor = prof.color;
    document.getElementById('professionSelector').style.borderColor = prof.color;
    document.getElementById('printHeaderTitle').innerText = `${prof.title} MATERIALLLAR VA JIXOZLAR SMETASI`;
    document.getElementById('professionSelector').value = currentProfession;

    selectedQuantities = JSON.parse(localStorage.getItem(`qty_${currentProfession}`)) || {};
    selectedPrices = JSON.parse(localStorage.getItem(`price_${currentProfession}`)) || {};

    const masterName = localStorage.getItem(`master_${currentProfession}`) || "";
    document.getElementById('masterNameInput').value = masterName;
    document.getElementById('displayMasterName').innerText = masterName || "________________";

    const clientName = localStorage.getItem(`client_${currentProfession}`) || "";
    document.getElementById('clientNameInput').value = clientName;
    document.getElementById('displayClientName').innerText = clientName || "________________";

    fetch(prof.file)
        .then(response => response.json())
        .then(data => {
            allMaterials = data;
            populateCategories(data); // This function will be updated to use hardcoded Uzbek
            renderMaterials(data);
            buildPrintTable();
        })
        .catch(error => {
            console.error("Xatolik:", error);
            document.getElementById('materialsList').innerHTML = `<p class="text-danger text-center">Fayl topilmadi: ${prof.file}</p>`; // Hardcoded Uzbek
        });
}

document.getElementById('masterNameInput').addEventListener('input', function(e) {
    localStorage.setItem(`master_${currentProfession}`, e.target.value);
    document.getElementById('displayMasterName').innerText = e.target.value;
});

document.getElementById('clientNameInput').addEventListener('input', function(e) {
    localStorage.setItem(`client_${currentProfession}`, e.target.value);
    document.getElementById('displayClientName').innerText = e.target.value;
});

document.getElementById('professionSelector').addEventListener('change', function(e) {
    currentProfession = e.target.value;
    localStorage.setItem('currentProfession', currentProfession);
    document.getElementById('searchInput').value = "";
    document.getElementById('categoryFilter').value = "";
    initApp();
});

function populateCategories(data) {
    const categories = [...new Set(data.map(item => item.category))];
    const select = document.getElementById('categoryFilter');
    select.innerHTML = `<option value="">Barcha bo'limlar</option>`; // Hardcoded Uzbek
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.innerText = cat;
        select.appendChild(opt);
    });
}

function renderMaterials(materials) {
    const container = document.getElementById('materialsList');
    container.innerHTML = '';

    if(materials.length === 0) {
        container.innerHTML = `<p class="text-center text-muted my-4">Hech narsa topilmadi.</p>`; // Hardcoded Uzbek
        return;
    }

    const grouped = {};
    materials.forEach(item => {
        if (!grouped[item.category]) grouped[item.category] = [];
        grouped[item.category].push(item);
    });

    for (const category in grouped) {
        const catHeader = document.createElement('div');
        catHeader.className = 'category-header';
        catHeader.innerText = category;
        container.appendChild(catHeader);

        grouped[category].forEach(item => {
            const row = document.createElement('div');
            
            const currentQty = selectedQuantities[item.id] || '';
            const currentPrice = selectedPrices[item.id] || '';
            
            row.className = `material-row ${currentQty > 0 ? 'has-value' : ''}`;

            // Qidiruv so'zini yoritish (Highlighting)
            const searchVal = document.getElementById('searchInput').value.trim();
            let displayName = item.name;
            if (searchVal) {
                const regex = new RegExp(`(${searchVal})`, 'gi');
                displayName = item.name.replace(regex, '<mark class="highlight">$1</mark>');
            }

            row.innerHTML = `
                <div>${displayName} <small class="text-muted">(${item.unit})</small></div>
                <div>
                    <input type="number" class="form-control form-control-sm qty-input" 
                        placeholder="Soni" min="0" value="${currentQty}" oninput="updateQty(${item.id}, this.value)"> <!-- Hardcoded placeholder -->
                </div>
                <div>
                    <input type="number" class="form-control form-control-sm price-input" 
                        placeholder="Narxi" min="0" value="${currentPrice}" oninput="updatePrice(${item.id}, this.value)"> <!-- Hardcoded placeholder -->
                </div>
            `;
            container.appendChild(row);
        });
    }
}

function updateQty(id, value) { 
    selectedQuantities[id] = value; 
    localStorage.setItem(`qty_${currentProfession}`, JSON.stringify(selectedQuantities));
    buildPrintTable(); 
}
function updatePrice(id, value) { 
    selectedPrices[id] = value; 
    localStorage.setItem(`price_${currentProfession}`, JSON.stringify(selectedPrices));
    buildPrintTable(); 
}

function clearAllInputs() {
    if(confirm(`${PROFESSIONS[currentProfession].title} bo'limidagi barcha ma'lumotlarni o'chirib tashlamoqchimisiz?`)) {
        localStorage.removeItem(`qty_${currentProfession}`);
        localStorage.removeItem(`price_${currentProfession}`);
        location.reload();
    }
}

function filterMaterials() {
    const searchVal = document.getElementById('searchInput').value.toLowerCase().trim();
    const catVal = document.getElementById('categoryFilter').value;
    const showSelectedOnly = document.getElementById('showSelectedOnly').checked;

    const filtered = allMaterials.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchVal) || 
                              item.category.toLowerCase().includes(searchVal);
        const matchesCategory = catVal === "" || item.category === catVal;
        const matchesSelected = !showSelectedOnly || (selectedQuantities[item.id] && parseFloat(selectedQuantities[item.id]) > 0);
        
        return matchesSearch && matchesCategory && matchesSelected;
    });
    renderMaterials(filtered);
}

document.getElementById('showSelectedOnly').addEventListener('change', filterMaterials);

document.getElementById('categoryFilter').addEventListener('change', function() {
    document.getElementById('searchInput').value = ""; 
    filterMaterials();
});

document.getElementById('searchInput').addEventListener('input', filterMaterials);

function buildPrintTable() {
    const tbody = document.getElementById('printTableBody');
    tbody.innerHTML = '';
    let index = 1;
    let totalSum = 0;

    const selectedByCategory = {};
    allMaterials.forEach(item => {
        const qty = parseFloat(selectedQuantities[item.id]);
        if (qty > 0) {
            if (!selectedByCategory[item.category]) selectedByCategory[item.category] = [];
            selectedByCategory[item.category].push(item);
        }
    });

    for (const category in selectedByCategory) {
        const headerTr = document.createElement('tr');
        headerTr.innerHTML = `<td colspan="6" class="table-secondary fw-bold text-center">${category}</td>`;
        tbody.appendChild(headerTr);

        selectedByCategory[category].forEach(item => {
            const qty = parseFloat(selectedQuantities[item.id]);
            const price = parseFloat(selectedPrices[item.id]) || 0;
            const cost = qty * price;
            totalSum += cost;

                const tr = document.createElement('tr'); // Har bir material uchun qator
            tr.innerHTML = `
                <td>${index++}</td>
                <td>${item.name}</td>
                <td>${item.unit}</td>
                <td>${qty}</td>
                <td>${price > 0 ? price.toLocaleString() : '-'}</td>
                <td>${cost > 0 ? cost.toLocaleString() : '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    document.getElementById('printTotalSum').innerText = totalSum.toLocaleString() + " so'm"; // Hardcoded Uzbek currency
    document.getElementById('liveTotalSum').innerText = totalSum.toLocaleString() + " so'm"; // Hardcoded Uzbek currency
    if(index === 1) tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Hech narsa tanlanmagan</td></tr>`; // Hardcoded Uzbek
}

function exportToExcel() {
    const workbook = XLSX.utils.book_new();
    let grandTotal = 0;
    const selectedByCategory = {};
    
    // Ma'lumotlarni bevosita inputlardan olish (export vaqtida eng yangi qiymatlarni olish uchun)
    const masterName = document.getElementById('masterNameInput').value;
    const clientName = document.getElementById('clientNameInput').value;
    const profTitle = PROFESSIONS[currentProfession].title;
    
    // Sana formatini tozalash (nuqtali qilish) - fayl nomi uchun xavfsiz
    const now = new Date();
    const currentDate = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
    
    // Varaq nomini tozalash funksiyasi (Excel taqiqlagan belgilar)
    const sanitizeSheetName = (name) => {
        return name.replace(/[\\/*?:[\]]/g, "_").substring(0, 31);
    };

    // Define styles for Excel export
    const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } }, // White font
        fill: { fgColor: { rgb: "4472C4" } }, // Blue background (Bootstrap primary color)
        alignment: { horizontal: "center", vertical: "center" },
        border: {
            top: { style: "thin", color: { auto: 1 } }, bottom: { style: "thin", color: { auto: 1 } },
            left: { style: "thin", color: { auto: 1 } }, right: { style: "thin", color: { auto: 1 } }
        }
    };
    const categoryTotalStyle = {
        font: { bold: true },
        fill: { fgColor: { rgb: "D9E1F2" } }, // Light blue background
        border: {
            top: { style: "thin", color: { auto: 1 } }, bottom: { style: "thin", color: { auto: 1 } },
            left: { style: "thin", color: { auto: 1 } }, right: { style: "thin", color: { auto: 1 } }
        }
    };
    const currencyCellStyleUz = { numFmt: "#,##0 \"so'm\"" };
    let currentCurrencyStyle = currencyCellStyleUz; // Only Uzbek currency style

    allMaterials.forEach(item => {
        const qty = parseFloat(selectedQuantities[item.id]);
        if (qty > 0) {
            if (!selectedByCategory[item.category]) selectedByCategory[item.category] = [];
            selectedByCategory[item.category].push(item);
        }
    });

    for (const category in selectedByCategory) {
        const sheetData = [];

        // Add header rows for the sheet (Hardcoded Uzbek)
        sheetData.push([profTitle + " MATERIALLLAR VA JIXOZLAR SMETASI"]);
        sheetData.push(["Sana:", currentDate]);
        sheetData.push(["Usta:", masterName]);
        sheetData.push(["Mijoz:", clientName]);
        sheetData.push([]); // Empty row for spacing
        sheetData.push([category]); // Category title
        sheetData.push(["№", "Material nomi", "Birligi", "Soni", "Dona narxi", "Umumiy summa"]); // Main table headers (Hardcoded Uzbek)

        let catSum = 0;
        let index = 1;
        selectedByCategory[category].forEach(item => {
            const qty = parseFloat(selectedQuantities[item.id]);
            const price = parseFloat(selectedPrices[item.id]) || 0;
            const cost = qty * price;
            catSum += cost;
            sheetData.push([index++, item.name, item.unit, qty, price, cost]); // Push raw numbers
        });

        sheetData.push(["", "", "", "", "BO'LIM JAMI:", catSum]); // Push raw number for catSum (Hardcoded Uzbek)

        const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

        // Apply styles
        // Merge cells for main title, date, master, client
        worksheet["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Main Title
            // Label va qiymat kataklarini birlashtirishni olib tashladik, shunda ikkalasi ham ko'rinadi
            { s: { r: 5, c: 0 }, e: { r: 5, c: 5 } }  // Category Title
        ];

        // Style for main title
        if (worksheet['A1']) {
            worksheet['A1'].s = {
                font: { bold: true, sz: 14, color: { rgb: "000000" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
        // Style for category title
        const categoryTitleCellRef = XLSX.utils.encode_cell({ r: 5, c: 0 });
        if (worksheet[categoryTitleCellRef]) {
            worksheet[categoryTitleCellRef].s = {
                font: { bold: true, sz: 12, color: { rgb: "000000" } },
                fill: { fgColor: { rgb: "D9E1F2" } }, // Light blue background
                alignment: { horizontal: "center", vertical: "center" }
            };
        }

        // Apply header style to the main table headers (row 7 in sheetData, which is index 6)
        const headerRowIndex = 6;
        for (let C = 0; C < 6; ++C) { // Iterate through 6 columns
            const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
            if (worksheet[cellRef]) {
                worksheet[cellRef].s = headerStyle;
            }
        }

        // Apply currency formatting to price and total columns
        for (let R = headerRowIndex + 1; R < sheetData.length - 1; ++R) { // Skip header and total rows
            const priceCellRef = XLSX.utils.encode_cell({ r: R, c: 4 }); // Price column
            const costCellRef = XLSX.utils.encode_cell({ r: R, c: 5 });  // Total sum column
            if (worksheet[priceCellRef]) {
                worksheet[priceCellRef].s = currentCurrencyStyle;
            }
            if (worksheet[costCellRef]) {
                worksheet[costCellRef].s = currentCurrencyStyle;
            }
        }

        // Apply category total style
        const categoryTotalRowIndex = sheetData.length - 1;
        for (let C = 0; C < sheetData[categoryTotalRowIndex].length; ++C) {
            const cellRef = XLSX.utils.encode_cell({ r: categoryTotalRowIndex, c: C });
            if (worksheet[cellRef]) {
                worksheet[cellRef].s = categoryTotalStyle;
            }
        }
        // Apply currency style to the category total sum cell
        const catTotalSumCellRef = XLSX.utils.encode_cell({ r: categoryTotalRowIndex, c: 5 });
        if (worksheet[catTotalSumCellRef]) {
            worksheet[catTotalSumCellRef].s = { ...categoryTotalStyle, ...currentCurrencyStyle };
        }

        // Auto-fit columns
        const colWidths = sheetData[headerRowIndex].map((_, i) => ({
            wch: Math.max(...sheetData.map(row => (row[i] ? String(row[i]).length : 0))) + 2
        }));
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(category));
        grandTotal += catSum; // Grand totalni har bir bo'lim jami bilan yangilash
    }

    // Umumiy natija varog'ini qo'shish
    if (grandTotal > 0) {
        const summaryData = [
            [profTitle + " MATERIALLLAR VA JIXOZLAR SMETASI"], // Hardcoded Uzbek
            ["Sana:", currentDate], // Hardcoded Uzbek
            ["Usta:", masterName], // Hardcoded Uzbek
            ["Mijoz:", clientName], // Hardcoded Uzbek by eldorcoder
            ["", ""], // Bo'sh qator
            ["UMUMIY JAMI:", grandTotal] // Hardcoded Uzbek, raw number for formatting
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

        // Apply styles to summary sheet
        // Merge cells for main title
        summarySheet["!merges"] = [
            { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }
        ];
        // Style for main title
        if (summarySheet['A1']) {
            summarySheet['A1'].s = {
                font: { bold: true, sz: 14, color: { rgb: "000000" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
        // Style for labels (bold)
        for (let R = 1; R <= 5; ++R) {
            const labelCellRef = XLSX.utils.encode_cell({ r: R, c: 0 });
            if (summarySheet[labelCellRef]) {
                summarySheet[labelCellRef].s = { font: { bold: true } };
            }
        }
        // Apply currency format to grand total
        const grandTotalCellRef = XLSX.utils.encode_cell({ r: 5, c: 1 });
        if (summarySheet[grandTotalCellRef]) {
            summarySheet[grandTotalCellRef].s = currentCurrencyStyle;
        }

        // Auto-fit columns for summary sheet
        const summaryColWidths = summaryData[0].map((_, i) => ({
            wch: Math.max(...summaryData.map(row => (row[i] ? String(row[i]).length : 0))) + 2
        }));
        summarySheet['!cols'] = summaryColWidths;

        XLSX.utils.book_append_sheet(workbook, summarySheet, "Umumiy Jami");
    }

    const fileName = `Smeta_${profTitle}_${currentDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

initApp();