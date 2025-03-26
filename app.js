// Drug database - in a real app, this would be fetched from a reliable API
const drugDatabase = {
    induction: [
        {
            name: "Propofol",
            category: "Induction",
            inductionDose: (weight, age, asa) => {
                // Dosing based on Miller's Anesthesia
                if (asa >= 4) return `${Math.round(weight * 0.5)}-${Math.round(weight * 1)} mg (0.5-1 mg/kg)`;
                if (age > 65) return `${Math.round(weight * 1)}-${Math.round(weight * 1.5)} mg (1-1.5 mg/kg)`;
                return `${Math.round(weight * 1.5)}-${Math.round(weight * 2.5)} mg (1.5-2.5 mg/kg)`;
            },
            maintenanceDose: (weight) => `${Math.round(weight * 4)}-${Math.round(weight * 12)} mg/kg/hr (4-12 mg/kg/hr)`,
            preparation: "Typically supplied as 10 mg/mL (1%) or 20 mg/mL (2%) solution. No dilution needed for bolus. For infusion, may dilute in 5% dextrose to 1-2 mg/mL.",
            references: [
                "Miller's Anesthesia, 9th ed. Chapter 26: Intravenous Drug Delivery Systems",
                "Stoelting's Pharmacology & Physiology in Anesthetic Practice, 6th ed."
            ]
        },
        // More induction drugs...
    ],
    maintenance: [
        {
            name: "Sevoflurane",
            category: "Maintenance",
            mac: (age) => {
                // MAC values based on age
                if (age < 1) return 3.3;
                if (age < 5) return 2.5;
                if (age < 40) return 2.0;
                if (age < 60) return 1.8;
                return 1.4;
            },
            inductionDose: "N/A",
            maintenanceDose: (age) => `1-2.5% (${(0.7 * this.mac(age)).toFixed(1)}-${(1.3 * this.mac(age)).toFixed(1)} MAC)`,
            preparation: "Use vaporizer specifically designed for sevoflurane. No preparation needed.",
            references: [
                "Miller's Anesthesia, 9th ed. Chapter 24: Inhaled Anesthetics",
                "UpToDate: Inhalation anesthetic agents"
            ]
        },
        // More maintenance drugs...
    ],
    analgesics: [
        {
            name: "Fentanyl",
            category: "Analgesic",
            inductionDose: (weight) => `${Math.round(weight * 1)}-${Math.round(weight * 3)} mcg (1-3 mcg/kg)`,
            maintenanceDose: (weight) => `${Math.round(weight * 0.5)}-${Math.round(weight * 2)} mcg/kg/hr (0.5-2 mcg/kg/hr)`,
            bolusDose: (weight) => `${Math.round(weight * 0.5)}-${Math.round(weight * 1)} mcg/kg`,
            preparation: "Dilute for infusion: 10-20 mcg/mL in NS or D5W. For PCA: typically 10 mcg/mL.",
            references: [
                "Stoelting's Pharmacology & Physiology in Anesthetic Practice, 6th ed.",
                "UpToDate: Intravenous opioid analgesics"
            ]
        },
        // More analgesics...
    ],
    muscleRelaxants: [
        {
            name: "Rocuronium",
            category: "Muscle Relaxant",
            inductionDose: (weight) => `${Math.round(weight * 0.6)} mg (0.6 mg/kg)`,
            maintenanceDose: (weight) => `${Math.round(weight * 0.1)}-${Math.round(weight * 0.2)} mg/kg every 20-45 min`,
            infusionDose: (weight) => `${Math.round(weight * 0.3)}-${Math.round(weight * 0.6)} mg/kg/hr (5-10 mcg/kg/min)`,
            reversal: "Sugammadex 2-4 mg/kg (based on TOF monitoring)",
            preparation: "For bolus: undiluted (10 mg/mL). For infusion: dilute to 0.5-1 mg/mL in NS or D5W.",
            references: [
                "Miller's Anesthesia, 9th ed. Chapter 34: Neuromuscular Blocking Agents",
                "UpToDate: Neuromuscular blocking agents (NMBAs) for rapid sequence intubation in adults"
            ]
        },
        // More muscle relaxants...
    ],
    vasoactive: [
        {
            name: "Phenylephrine",
            category: "Vasoactive",
            bolusDose: (weight) => `${Math.round(weight * 0.5)}-${Math.round(weight * 2)} mcg (0.5-2 mcg/kg)`,
            infusionDose: (weight) => `${Math.round(weight * 0.1)}-${Math.round(weight * 0.5)} mcg/kg/min`,
            preparation: "For infusion: typically dilute 10 mg in 250 mL NS (40 mcg/mL) or 20 mg in 500 mL NS (40 mcg/mL).",
            references: [
                "Stoelting's Pharmacology & Physiology in Anesthetic Practice, 6th ed.",
                "UpToDate: Use of vasopressors and inotropes"
            ]
        },
        // More vasoactive drugs...
    ]
};

// DOM elements
const patientForm = document.getElementById('patientForm');
const resultsSection = document.getElementById('resultsSection');
const toast = document.getElementById('toast');

// Tab functionality
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons and content
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked button and corresponding content
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Calculate doses
patientForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get patient data
    const age = parseInt(document.getElementById('age').value);
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseInt(document.getElementById('height').value);
    const sex = document.querySelector('input[name="sex"]:checked').value;
    const asa = parseInt(document.getElementById('asa').value);
    
    // Validate input
    if (weight <= 0 || age < 0 || height <= 0) {
        showToast('Please enter valid patient data', 'error');
        return;
    }
    
    // Calculate BMI
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    // Calculate doses for each category
    calculateDoses('induction', age, weight, height, sex, asa, bmi);
    calculateDoses('maintenance', age, weight, height, sex, asa, bmi);
    calculateDoses('analgesics', age, weight, height, sex, asa, bmi);
    calculateDoses('muscle-relaxants', age, weight, height, sex, asa, bmi);
    calculateDoses('vasoactive', age, weight, height, sex, asa, bmi);
    
    // Show results section
    resultsSection.style.display = 'block';
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
    
    showToast('Doses calculated successfully', 'success');
});

function calculateDoses(category, age, weight, height, sex, asa, bmi) {
    const tabContent = document.getElementById(category);
    tabContent.innerHTML = '';
    
    // Get drugs for this category
    const drugs = drugDatabase[category.replace('-', '')];
    
    if (!drugs || drugs.length === 0) {
        tabContent.innerHTML = '<p>No drugs available in this category.</p>';
        return;
    }
    
    // Create drug cards
    drugs.forEach(drug => {
        const drugCard = document.createElement('div');
        drugCard.className = 'drug-card';
        
        // Drug name
        const drugName = document.createElement('h3');
        drugName.innerHTML = `<i class="material-icons">medication</i> ${drug.name}`;
        drugCard.appendChild(drugName);
        
        // Dose information
        const doseInfo = document.createElement('div');
        doseInfo.className = 'dose-info';
        
        // Add doses based on what's available for the drug
        if (drug.inductionDose) {
            const inductionDose = document.createElement('div');
            inductionDose.className = 'dose-item';
            inductionDose.innerHTML = `
                <h4>Induction Dose</h4>
                <p class="dose-value">${typeof drug.inductionDose === 'function' ? drug.inductionDose(weight, age, asa) : drug.inductionDose}</p>
            `;
            doseInfo.appendChild(inductionDose);
        }
        
        if (drug.maintenanceDose) {
            const maintenanceDose = document.createElement('div');
            maintenanceDose.className = 'dose-item';
            maintenanceDose.innerHTML = `
                <h4>Maintenance Dose</h4>
                <p class="dose-value">${typeof drug.maintenanceDose === 'function' ? drug.maintenanceDose(weight, age) : drug.maintenanceDose}</p>
            `;
            doseInfo.appendChild(maintenanceDose);
        }
        
        if (drug.bolusDose) {
            const bolusDose = document.createElement('div');
            bolusDose.className = 'dose-item';
            bolusDose.innerHTML = `
                <h4>Bolus Dose</h4>
                <p class="dose-value">${typeof drug.bolusDose === 'function' ? drug.bolusDose(weight) : drug.bolusDose}</p>
            `;
            doseInfo.appendChild(bolusDose);
        }
        
        if (drug.infusionDose) {
            const infusionDose = document.createElement('div');
            infusionDose.className = 'dose-item';
            infusionDose.innerHTML = `
                <h4>Infusion Rate</h4>
                <p class="dose-value">${typeof drug.infusionDose === 'function' ? drug.infusionDose(weight) : drug.infusionDose}</p>
            `;
            doseInfo.appendChild(infusionDose);
        }
        
        if (drug.mac) {
            const macDose = document.createElement('div');
            macDose.className = 'dose-item';
            macDose.innerHTML = `
                <h4>MAC Value</h4>
                <p class="dose-value">${typeof drug.mac === 'function' ? drug.mac(age).toFixed(1) : drug.mac} (age-adjusted)</p>
            `;
            doseInfo.appendChild(macDose);
        }
        
        if (drug.reversal) {
            const reversalDose = document.createElement('div');
            reversalDose.className = 'dose-item';
            reversalDose.innerHTML = `
                <h4>Reversal</h4>
                <p class="dose-value">${drug.reversal}</p>
            `;
            doseInfo.appendChild(reversalDose);
        }
        
        drugCard.appendChild(doseInfo);
        
        // Preparation instructions
        if (drug.preparation) {
            const prepDiv = document.createElement('div');
            prepDiv.className = 'preparation';
            prepDiv.innerHTML = `
                <h4>Preparation</h4>
                <p>${drug.preparation}</p>
            `;
            drugCard.appendChild(prepDiv);
        }
        
        tabContent.appendChild(drugCard);
    });
    
    // Update references
    updateReferences(drugs);
}

function updateReferences(drugs) {
    const referencesList = document.getElementById('referencesList');
    const uniqueRefs = new Set();
    
    // Collect all unique references
    drugs.forEach(drug => {
        if (drug.references) {
            drug.references.forEach(ref => uniqueRefs.add(ref));
        }
    });
    
    // Clear existing references
    referencesList.innerHTML = '';
    
    // Add new references
    uniqueRefs.forEach(ref => {
        const li = document.createElement('li');
        li.textContent = ref;
        referencesList.appendChild(li);
    });
}

function showToast(message, type) {
    toast.textContent = message;
    toast.className = 'toast';
    
    // Add type class if specified
    if (type) {
        toast.classList.add(type);
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Install prompt for PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Show install button or custom prompt
    showToast('This app can be installed to your home screen', 'info');
    
    // Optional: Add your own install button handler
    // installButton.addEventListener('click', () => {
    //     deferredPrompt.prompt();
    // });
});