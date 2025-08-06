// بيانات Firebase التي قدمتها
const firebaseConfig = {
    apiKey: "AIzaSyBIP8ezD990c7kZ3z-gsma2KJpp7Zqu7eA",
    authDomain: "ishtrakta.firebaseapp.com",
    databaseURL: "https://ishtrakta-default-rtdb.firebaseio.com",
    projectId: "ishtrakta",
    storageBucket: "ishtrakta.firebasestorage.app",
    messagingSenderId: "854766859254",
    appId: "1:854766859254:web:0375c2c8c9c518b2f74dd7",
    measurementId: "G-QT71DGNRXT"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const storage = firebase.storage();
const subscriptionsRef = database.ref('subscriptions');

const subscriptionsData = {
    '1': { name: 'اشتراك إنقاص الوزن النباتي', periods: { 'اسبوع': 87.5, '2اسبوع': 120, '4اسابيع': 240 } },
    '2': { name: 'اشتراك إنقاص الوزن', periods: { 'اسبوع': 93.5, '2اسبوع': 130, '4اسابيع': 250 } },
    '3': { name: 'اشتراك خاص لرفع المناعة', periods: { 'اسبوع': 95, '2اسبوع': 145, '4اسابيع': 280 } },
    '4': { name: 'اشتراك نظام الكيتو', periods: { 'اسبوع': 95, '2اسبوع': 140, '4اسابيع': 280 } },
    '5': { name: 'اشتراك خالي من الجلوتين', periods: { 'اسبوع': 93.5, '2اسبوع': 130, '4اسابيع': 260 } },
    '6': { name: 'اشتراك خالي من الجلوتين ومنتجات الألبان', periods: { 'اسبوع': 91.5, '2اسبوع': 128.5, '4اسابيع': 255 } },
    '7': { name: 'اشتراك التخلص من الالتهابات في الجسم بالصيام المتقطع', periods: { '10أيام': 120, '20يوم': 200, '30يوم': 290 } },
    '8': { name: 'اشتراك التخلص من الإلتهابات بدون صيام', periods: { '10أيام': 130, '20يوم': 210, '30يوم': 300 } },
    '9': { name: 'اشتراك رمضان', periods: { 'اسبوع': 90, '2اسبوع': 140, '4اسابيع': 240 } },
    '10': { name: 'اشتراك رمضان النباتي', periods: { 'اسبوع': 80, '2اسبوع': 130, '4اسابيع': 230 } },
    '11': { name: 'اشتراك رفع نسب امتصاص الفيتامينات والمعادن', periods: { 'اسبوع': 93.5, '2اسبوع': 130, '4اسابيع': 250 } },
    '12': { name: 'اشتراك خاص للنساء المرضعات', periods: { 'اسبوع': 93.5, '2اسبوع': 130, '4اسابيع': 260 } },
    '13': { name: 'اشتراك ضد أنواع الحساسيات الشائعة', periods: { 'اسبوع': 96.5, '2اسبوع': 133.5, '4اسابيع': 260 } },
    '14': { name: 'اشتراك خاص للرياضيين', periods: { '10أيام': 120, '20يوم': 180, '30يوم': 230 } },
    '15': { name: 'اسلوب الحياة الصحية', periods: { '10أيام': 120, '20يوم': 180, '30يوم': 230 } },
    '16': { name: 'اشتراك الأخصائية ريم العنزي، محسوب السعرات', periods: { '10أيام': 150, '20يوم': 200, '30يوم': 230 } },
    '17': { name: 'اشتراك ريوق المستشفى', periods: { 'اسبوع': 50, '2اسبوع': 80, '4اسابيع': 120 } },
    '18': { name: 'اشتراك مخصص', periods: { 'اسبوع': '؟', '2اسبوع': '؟', '4اسابيع': '؟', '10أيام': '؟', '20يوم': '؟', '30يوم': '؟' } }
};

const periodLengths = {
    'اسبوع': 7, '2اسبوع': 14, '4اسابيع': 28, '10أيام': 10, '20يوم': 20, '30يوم': 30
};
const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function arabicToEnglish(str) {
    const arabicNumbers = /[\u0660-\u0669]/g;
    return str.replace(arabicNumbers, (d) => d.charCodeAt(0) - 0x0660);
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('subscription-form')) {
        setupFormPage();
    }
    if (document.getElementById('signature-pad')) {
        setupSignPage();
    }
    if (document.getElementById('subscriptions-list')) {
        setupIndexPage();
    }
});

function setupFormPage() {
    const form = document.getElementById('subscription-form');
    const houseBtn = document.getElementById('house-btn');
    const apartmentBtn = document.getElementById('apartment-btn');
    const houseFields = document.getElementById('house-fields');
    const apartmentFields = document.getElementById('apartment-fields');
    const phoneInput = document.getElementById('phone-number');
    const subTypeSelect = document.getElementById('subscription-type');
    const subPeriodSelect = document.getElementById('subscription-period');
    const subOptionsDiv = document.getElementById('subscription-options');
    const customDetailsDiv = document.getElementById('custom-subscription-details');
    const customPriceInput = document.getElementById('custom-price');
    const startDateInput = document.getElementById('start-date');
    const endDateDisplay = document.getElementById('end-date-display');
    const deliveryDaysCheckboxes = document.querySelectorAll('input[name="delivery-day"]');
    const totalPriceDisplay = document.getElementById('total-price-display');
    const deliveryPriceInput = document.getElementById('delivery-price');
    
    let selectedAddressType = 'بيت';
    let calculatedEndDate = '';
    let selectedPrice = 0;

    // تهيئة الحقول المطلوبة عند التحميل الأولي
    document.querySelectorAll('#house-fields input[required]').forEach(input => input.setAttribute('required', 'required'));
    document.querySelectorAll('#apartment-fields input[required]').forEach(input => input.removeAttribute('required'));

    houseBtn.addEventListener('click', () => {
        houseBtn.classList.add('active');
        apartmentBtn.classList.remove('active');
        houseFields.style.display = 'block';
        apartmentFields.style.display = 'none';
        selectedAddressType = 'بيت';
        document.querySelectorAll('#house-fields input').forEach(input => {
            if (input.id !== 'house-avenue' && input.id !== 'house-nearby') {
                input.setAttribute('required', 'required');
            }
        });
        document.querySelectorAll('#apartment-fields input').forEach(input => input.removeAttribute('required'));
    });

    apartmentBtn.addEventListener('click', () => {
        apartmentBtn.classList.add('active');
        houseBtn.classList.remove('active');
        apartmentFields.style.display = 'block';
        houseFields.style.display = 'none';
        selectedAddressType = 'شقة';
        document.querySelectorAll('#apartment-fields input').forEach(input => {
            if (input.id !== 'apartment-avenue' && input.id !== 'apartment-nearby') {
                input.setAttribute('required', 'required');
            }
        });
        document.querySelectorAll('#house-fields input').forEach(input => input.removeAttribute('required'));
    });
    
    phoneInput.addEventListener('input', (e) => {
        e.target.value = arabicToEnglish(e.target.value);
    });

    subTypeSelect.addEventListener('change', (e) => {
        const subId = e.target.value;
        const sub = subscriptionsData[subId];
        subOptionsDiv.style.display = 'block';
        subPeriodSelect.innerHTML = '<option value="" disabled selected>اختر الفترة</option>';
        customDetailsDiv.style.display = 'none';

        if (subId === '18') {
            customDetailsDiv.style.display = 'block';
            customPriceInput.setAttribute('required', 'required');
            for (const period in periodLengths) {
                 const option = document.createElement('option');
                 option.value = period;
                 option.textContent = period;
                 subPeriodSelect.appendChild(option);
            }
        } else {
            customPriceInput.removeAttribute('required');
            for (const period in sub.periods) {
                const option = document.createElement('option');
                option.value = period;
                option.textContent = `${period} = ${sub.periods[period]} د.ك`;
                subPeriodSelect.appendChild(option);
            }
        }
        updateTotalPrice();
    });

    subPeriodSelect.addEventListener('change', updateTotalPrice);
    customPriceInput.addEventListener('input', updateTotalPrice);
    deliveryPriceInput.addEventListener('input', updateTotalPrice);

    function updateTotalPrice() {
        const subId = subTypeSelect.value;
        const sub = subscriptionsData[subId];
        const period = subPeriodSelect.value;
        const deliveryPrice = parseFloat(deliveryPriceInput.value) || 0;

        if (subId === '18' && customPriceInput.value) {
            selectedPrice = parseFloat(customPriceInput.value);
        } else if (sub && sub.periods[period]) {
            selectedPrice = sub.periods[period];
        } else {
            selectedPrice = 0;
        }

        const totalPrice = selectedPrice + deliveryPrice;
        totalPriceDisplay.textContent = `${totalPrice.toFixed(2)} د.ك`;
        updateEndDate();
    }
    
    startDateInput.addEventListener('change', updateEndDate);
    deliveryDaysCheckboxes.forEach(cb => cb.addEventListener('change', updateEndDate));

    function updateEndDate() {
        if (!startDateInput.value || !subPeriodSelect.value) {
            endDateDisplay.textContent = 'يرجى تحديد تاريخ البدء والفترة.';
            return;
        }

        const startDate = new Date(startDateInput.value);
        const period = subPeriodSelect.value;
        let daysToDeliver = periodLengths[period];
        
        const enabledDays = Array.from(deliveryDaysCheckboxes).filter(cb => cb.checked).map(cb => parseInt(cb.value));
        if (enabledDays.length === 0) {
            endDateDisplay.textContent = 'يرجى اختيار أيام التوصيل.';
            return;
        }

        let currentDate = new Date(startDate);
        let daysCounted = 0;
        
        while (daysCounted < daysToDeliver) {
            if (enabledDays.includes(currentDate.getDay())) {
                daysCounted++;
            }
            if (daysCounted < daysToDeliver) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        calculatedEndDate = currentDate.toISOString().slice(0, 10);
        const endDateObj = new Date(calculatedEndDate);
        endDateDisplay.textContent = `${dayNames[endDateObj.getDay()]}، ${endDateObj.toLocaleDateString('ar-KW')}`;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // جمع البيانات
        const subscriptionData = {
            customerName: document.getElementById('customer-name').value,
            phoneNumber: phoneInput.value,
            address: { type: selectedAddressType },
            subscription: {
                type: subTypeSelect.value === '18' ? `اشتراك مخصص - ${document.getElementById('custom-sub-name').value}` : subscriptionsData[subTypeSelect.value].name,
                period: subPeriodSelect.value,
                price: selectedPrice
            },
            startDate: startDateInput.value,
            endDate: calculatedEndDate,
            deliveryDays: Array.from(deliveryDaysCheckboxes).filter(cb => cb.checked).map(cb => dayNames[parseInt(cb.value)]),
            deliveryPrice: parseFloat(deliveryPriceInput.value) || 0,
            status: 'pending',
            signatureImageUrl: '',
            customImageUrl: ''
        };

        if (selectedAddressType === 'بيت') {
            subscriptionData.address.details = {
                area: document.getElementById('house-area').value,
                piece: document.getElementById('house-piece').value,
                street: document.getElementById('house-street').value,
                avenue: document.getElementById('house-avenue').value,
                houseNumber: document.getElementById('house-number').value,
                nearbyBuilding: document.getElementById('house-nearby').value
            };
        } else {
            subscriptionData.address.details = {
                area: document.getElementById('apartment-area').value,
                piece: document.getElementById('apartment-piece').value,
                street: document.getElementById('apartment-street').value,
                avenue: document.getElementById('apartment-avenue').value,
                buildingNumber: document.getElementById('apartment-building').value,
                floor: document.getElementById('apartment-floor').value,
                flat: document.getElementById('apartment-flat').value,
                nearbyBuilding: document.getElementById('apartment-nearby').value
            };
        }
        
        const newSubscriptionRef = subscriptionsRef.push();
        const subscriptionId = newSubscriptionRef.key;
        
        const customImageFile = document.getElementById('custom-image').files[0];
        if (customImageFile) {
            const storageRef = storage.ref(`custom_images/${subscriptionId}`);
            const snapshot = await storageRef.put(customImageFile);
            const downloadURL = await snapshot.ref.getDownloadURL();
            subscriptionData.subscription.customImageUrl = downloadURL;
        }

        await newSubscriptionRef.set(subscriptionData);

        const signUrl = `https://figsandolives.github.io/ishtrak/sign.html?id=${subscriptionId}`;
        
        const whatsappMsg = `تم تعبئة بيانات استمارة الاشتراك بنجاح، يرجى الضغط على الرابط التالي للاعتماد والتوقيع: ${signUrl}`;
        const whatsappUrl = `https://wa.me/965${subscriptionData.phoneNumber}?text=${encodeURIComponent(whatsappMsg)}`;
        
        window.location.href = whatsappUrl;
    });
}

function setupSignPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const subscriptionId = urlParams.get('id');

    if (!subscriptionId) {
        alert('خطأ: لا يوجد معرف للاشتراك.');
        window.location.href = 'index.html';
        return;
    }

    const canvas = document.getElementById('signature-pad');
    const approveBtn = document.getElementById('approve-btn');
    const clearBtn = document.getElementById('clear-signature-btn');
    const summaryDiv = document.getElementById('subscription-summary');

    // تهيئة SignaturePad أولاً وقبل كل شيء
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(248, 248, 248)'
    });

    // وظيفة لضبط حجم لوحة التوقيع
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear();
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ربط حدث onBegin بعد تهيئة SignaturePad مباشرة
    signaturePad.onBegin = () => {
        approveBtn.disabled = false;
    };

    subscriptionsRef.child(subscriptionId).once('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const totalPrice = (data.subscription.price || 0) + (data.deliveryPrice || 0);
            const deliveryStatus = data.deliveryPrice > 0 ? `${data.deliveryPrice.toFixed(2)} د.ك` : 'مجاني';

            summaryDiv.innerHTML = `
                <p><strong>اسم الزبون:</strong> ${data.customerName}</p>
                <p><strong>نوع الاشتراك:</strong> ${data.subscription.type}</p>
                <p><strong>الفترة:</strong> ${data.subscription.period}</p>
                <p><strong>تاريخ البدء:</strong> ${data.startDate}</p>
                <p><strong>تاريخ الانتهاء:</strong> ${data.endDate}</p>
                <p><strong>السعر الإجمالي:</strong> ${totalPrice.toFixed(2)} د.ك</p>
                <p><strong>سعر التوصيل:</strong> ${deliveryStatus}</p>
            `;
        } else {
            summaryDiv.innerHTML = '<p>الاشتراك غير موجود أو تم حذفه.</p>';
            approveBtn.disabled = true;
        }
    });

    
    clearBtn.addEventListener('click', () => {
        signaturePad.clear();
        approveBtn.disabled = true;
    });

    approveBtn.addEventListener('click', async () => {
        if (signaturePad.isEmpty()) {
            alert('يرجى التوقيع أولاً.');
            return;
        }
        
        approveBtn.disabled = true;
        const signatureDataUrl = signaturePad.toDataURL();
        
        try {
            const storageRef = storage.ref(`signatures/${subscriptionId}`);
            await storageRef.putString(signatureDataUrl, 'data_url');
            const signatureUrl = await storageRef.getDownloadURL();

            await subscriptionsRef.child(subscriptionId).update({
                status: 'approved',
                signatureImageUrl: signatureUrl
            });
            
            alert('شكرا لثقتكم.. تم اعتماد الاشتراك، يرجى المتابعة مع الموظف للدفع');
            window.close();
            
        } catch (error) {
            console.error('حدث خطأ في الاعتماد:', error);
            alert('حدث خطأ أثناء الاعتماد. يرجى المحاولة مرة أخرى.');
            approveBtn.disabled = false;
        }
    });
}

function setupIndexPage() {
    const listDiv = document.getElementById('subscriptions-list');

    subscriptionsRef.on('value', (snapshot) => {
        const subscriptions = snapshot.val();
        listDiv.innerHTML = '';
        if (subscriptions) {
            for (const id in subscriptions) {
                const sub = subscriptions[id];
                if (sub.status === 'approved') {
                    const card = document.createElement('div');
                    card.classList.add('subscription-card');
                    card.innerHTML = `
                        <h3>استمارة #${id.substring(1, 15)}</h3>
                        <p><strong>العميل:</strong> ${sub.customerName}</p>
                        <p><strong>الاشتراك:</strong> ${sub.subscription.type}</p>
                        <p><strong>السعر الإجمالي:</strong> ${(sub.subscription.price + sub.deliveryPrice).toFixed(2)} د.ك</p>
                        <button onclick="editSubscription('${id}')">تعديل</button>
                        <button onclick="deleteSubscription('${id}')">حذف</button>
                        <button onclick="printSubscription('${id}')">طباعة</button>
                    `;
                    listDiv.appendChild(card);
                }
            }
        } else {
            listDiv.innerHTML = '<p>لا توجد اشتراكات معتمدة بعد.</p>';
        }
    });
}

function editSubscription(id) {
    alert(`سيتم فتح نموذج التعديل للاشتراك رقم: ${id}`);
}

function deleteSubscription(id) {
    if (confirm('هل أنت متأكد من حذف هذا الاشتراك؟')) {
        subscriptionsRef.child(id).remove();
        alert('تم حذف الاشتراك بنجاح.');
    }
}

async function printSubscription(id) {
    const sub = (await subscriptionsRef.child(id).once('value')).val();
    if (!sub) {
        alert('الاشتراك غير موجود.');
        return;
    }
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>طباعة استمارة اشتراك</title>');
    printWindow.document.write('<style>');
    printWindow.document.write(`
        body { font-family: 'Arial', sans-serif; direction: rtl; text-align: right; }
        .page { width: 21cm; min-height: 29.7cm; margin: auto; padding: 2cm; }
        h1, h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ccc; padding: 8px; text-align: right; }
        .signature-container { margin-top: 50px; text-align: center; }
        .signature-image { max-width: 300px; border: 1px dashed #333; padding: 10px; }
    `);
    printWindow.document.write('</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div class="page">');
    printWindow.document.write(`<h1>استمارة اشتراك #${id.substring(1, 15)}</h1>`);
    printWindow.document.write('<h2>بيانات العميل</h2>');
    printWindow.document.write('<table>');
    printWindow.document.write(`<tr><td><strong>الاسم:</strong></td><td>${sub.customerName}</td></tr>`);
    printWindow.document.write(`<tr><td><strong>رقم الهاتف:</strong></td><td>${sub.phoneNumber}</td></tr>`);
    printWindow.document.write(`<tr><td><strong>العنوان:</strong></td><td>${sub.address.type} - ${Object.values(sub.address.details).filter(val => val).join(', ')}</td></tr>`);
    printWindow.document.write('</table>');
    printWindow.document.write('<h2>تفاصيل الاشتراك</h2>');
    printWindow.document.write('<table>');
    printWindow.document.write(`<tr><td><strong>نوع الاشتراك:</strong></td><td>${sub.subscription.type}</td></tr>`);
    printWindow.document.write(`<tr><td><strong>الفترة:</strong></td><td>${sub.subscription.period}</td></tr>`);
    printWindow.document.write(`<tr><td><strong>تاريخ البدء:</strong></td><td>${sub.startDate}</td></tr>`);
    printWindow.document.write(`<tr><td><strong>تاريخ الانتهاء:</strong></td><td>${sub.endDate}</td></tr>`);
    printWindow.document.write(`<tr><td><strong>أيام التوصيل:</strong></td><td>${sub.deliveryDays.join(', ')}</td></tr>`);
    printWindow.document.write(`<tr><td><strong>سعر الاشتراك:</strong></td><td>${sub.subscription.price} د.ك</td></tr>`);
    printWindow.document.write(`<tr><td><strong>سعر التوصيل:</strong></td><td>${sub.deliveryPrice > 0 ? sub.deliveryPrice : 'مجاني'}</td></tr>`);
    printWindow.document.write(`<tr><td><strong>الإجمالي:</strong></td><td>${(sub.subscription.price + sub.deliveryPrice).toFixed(2)} د.ك</td></tr>`);
    printWindow.document.write('</table>');

    printWindow.document.write(`
        <div class="terms-and-conditions">
            <h2>الشروط والأحكام</h2>
            <ul>
                <li>المبلغ المدفوع لا يسترد.</li>
                <li>يجب إبلاغنا عن أي تغيير في العنوان قبل 24 ساعة.</li>
                <li>في حالة التوقف المؤقت للاشتراك، يجب الإبلاغ قبل 48 ساعة.</li>
                <li>إذا تم إلغاء الاشتراك لأي سبب كان، لا يمكن استرجاع المبلغ.</li>
            </ul>
        </div>
    `);
    
    if (sub.signatureImageUrl) {
        printWindow.document.write(`<div class="signature-container"><h3>توقيع العميل</h3><img src="${sub.signatureImageUrl}" class="signature-image"/></div>`);
    }

    printWindow.document.write('</div>');

    let imageUrls = [];
    const subIdFromType = sub.subscription.type.split('-')[0].trim();
    let subIdNumeric = '';
    
    // محاولة استخراج الرقم من بداية اسم الاشتراك
    if (subIdFromType.match(/^\d+/)) {
        subIdNumeric = subIdFromType.match(/^\d+/)[0];
    }

    const period = sub.subscription.period;
    let copies = 0;
    if (period.includes('اسبوع') || period.includes('10أيام')) copies = 1;
    if (period.includes('2اسبوع') || period.includes('20يوم')) copies = 2;
    if (period.includes('4اسابيع') || period.includes('30يوم')) copies = 3;

    // معالجة الاشتراك المخصص (id=18)
    if (subIdFromType === 'اشتراك مخصص' && sub.subscription.customImageUrl) {
        imageUrls.push(sub.subscription.customImageUrl);
    } else if (subIdNumeric >= 1 && subIdNumeric <= 17) {
        const imagePath = `a${subIdNumeric}.jpg`;
        imageUrls.push(`https://firebasestorage.googleapis.com/v0/b/${firebaseConfig.storageBucket}/o/${encodeURIComponent(imagePath)}?alt=media`);
    }

    if (imageUrls.length > 0) {
        for (let i = 0; i < copies; i++) {
            printWindow.document.write('<div class="page" style="page-break-before: always;">');
            printWindow.document.write(`<img src="${imageUrls[0]}" style="width: 100%;">`);
            printWindow.document.write('</div>');
        }
    }
    
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}
