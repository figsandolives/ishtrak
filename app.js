
// إعداد Firebase
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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// متغيرات التوقيع
let canvas, ctx;
let isDrawing = false;
let hasSignature = false;
let subscriptionData = null;
let customerId = null;
let lastX = 0;
let lastY = 0;

// الحصول على معرف العميل من الرابط
function getCustomerIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('customer');
}

// تهيئة لوحة التوقيع
function initSignaturePad() {
    canvas = document.getElementById('signaturePad');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    
    ctx = canvas.getContext('2d');
    
    // تعيين حجم الكانفاس بناءً على حجم العنصر
    resizeCanvas();
    
    // إعدادات الرسم
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // أحداث الماوس
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // أحداث اللمس للهواتف
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    console.log('Signature pad initialized successfully');
}

// تغيير حجم الكانفاس
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    // إعادة تطبيق إعدادات الرسم
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
}

// الحصول على إحداثيات الماوس
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

// الحصول على إحداثيات اللمس
function getTouchPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
    };
}

// بدء الرسم
function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    
    console.log('Started drawing at:', lastX, lastY);
}

// الرسم
function draw(e) {
    if (!isDrawing) return;
    
    const pos = getMousePos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    lastX = pos.x;
    lastY = pos.y;
    
    if (!hasSignature) {
        hasSignature = true;
        canvas.classList.add('signed');
        updateSaveButton();
        updateSignatureStatus('تم التوقيع ✓');
    }
}

// إيقاف الرسم
function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        console.log('Stopped drawing');
    }
}

// التعامل مع بداية اللمس
function handleTouchStart(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getTouchPos(e);
    lastX = pos.x;
    lastY = pos.y;
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    
    console.log('Touch started at:', lastX, lastY);
}

// التعامل مع حركة اللمس
function handleTouchMove(e) {
    e.preventDefault();
    if (!isDrawing) return;
    
    const pos = getTouchPos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    lastX = pos.x;
    lastY = pos.y;
    
    if (!hasSignature) {
        hasSignature = true;
        canvas.classList.add('signed');
        updateSaveButton();
        updateSignatureStatus('تم التوقيع ✓');
    }
}

// التعامل مع انتهاء اللمس
function handleTouchEnd(e) {
    e.preventDefault();
    if (isDrawing) {
        isDrawing = false;
        console.log('Touch ended');
    }
}

// مسح التوقيع
function clearSignature() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
    canvas.classList.remove('signed');
    updateSaveButton();
    updateSignatureStatus('يرجى التوقيع والموافقة على الشروط لتفعيل زر الاعتماد');
    console.log('Signature cleared');
}

// تحديث حالة التوقيع
function updateSignatureStatus(message) {
    const statusElement = document.getElementById('signatureStatus');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

// تحديث زر الحفظ
function updateSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    const agreeTerms = document.getElementById('agreeTerms');
    
    if (!saveBtn || !agreeTerms) return;
    
    const canSave = hasSignature && agreeTerms.checked;
    saveBtn.disabled = !canSave;
    
    if (canSave) {
        updateSignatureStatus('جاهز للاعتماد ✅');
    } else if (hasSignature && !agreeTerms.checked) {
        updateSignatureStatus('يرجى الموافقة على الشروط والأحكام');
    } else if (!hasSignature && agreeTerms.checked) {
        updateSignatureStatus('يرجى التوقيع أولاً');
    }
}

// حفظ التوقيع
async function saveSignature() {
    if (!hasSignature) {
        alert('يرجى التوقيع أولاً');
        return;
    }

    if (!document.getElementById('agreeTerms').checked) {
        alert('يرجى الموافقة على الشروط والأحكام');
        return;
    }

    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = '⏳ جاري الحفظ...';

    try {
        // تحويل التوقيع إلى صورة
        const signatureDataURL = canvas.toDataURL('image/png');
        
        // رفع التوقيع إلى Firebase Storage
        const signatureBlob = dataURLtoBlob(signatureDataURL);
        const storageRef = storage.ref().child('signatures/' + customerId + '_signature.png');
        const snapshot = await storageRef.put(signatureBlob);
        const signatureURL = await snapshot.ref.getDownloadURL();

        // تحديث بيانات الاشتراك
        await db.collection('subscriptions').doc(customerId).update({
            status: 'approved',
            signatureURL: signatureURL,
            approvedAt: new Date()
        });

        // إظهار رسالة النجاح
        document.getElementById('successModal').classList.remove('hidden');

    } catch (error) {
        console.error('خطأ في حفظ التوقيع:', error);
        alert('حدث خطأ في حفظ التوقيع. يرجى المحاولة مرة أخرى.');
        
        // إعادة تفعيل الزر
        saveBtn.disabled = false;
        saveBtn.textContent = '✅ اعتماد الاشتراك';
    }
}

// تحويل Data URL إلى Blob
function dataURLtoBlob(dataURL) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

// تحميل بيانات الاشتراك
async function loadSubscriptionData() {
    try {
        console.log('Loading subscription data for customer:', customerId);
        
        const doc = await db.collection('subscriptions').doc(customerId).get();
        
        if (!doc.exists) {
            showError('الاشتراك غير موجود', 'لم يتم العثور على بيانات الاشتراك المطلوب');
            return;
        }

        subscriptionData = doc.data();
        console.log('Subscription data loaded:', subscriptionData);
        
        displaySubscriptionData();
        
        // إخفاء شاشة التحميل وإظهار المحتوى
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');

    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showError('خطأ في الاتصال', 'حدث خطأ في تحميل بيانات الاشتراك من الخادم');
    }
}

// عرض رسالة خطأ
function showError(title, message) {
    document.getElementById('loadingScreen').classList.add('hidden');
    document.getElementById('errorScreen').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// عرض بيانات الاشتراك
function displaySubscriptionData() {
    try {
        // بيانات العميل
        document.getElementById('customerName').textContent = subscriptionData.customerName || 'غير محدد';
        document.getElementById('phoneNumber').textContent = subscriptionData.phoneNumber || 'غير محدد';

        // العنوان
        displayAddressData();

        // تفاصيل الاشتراك
        displaySubscriptionDetails();

        // الأيام المستبعدة
        displayExcludedDays();

        // صورة الاشتراك
        displaySubscriptionImage();
        
        console.log('All subscription data displayed successfully');
        
    } catch (error) {
        console.error('خطأ في عرض البيانات:', error);
        showError('خطأ في عرض البيانات', 'حدث خطأ في عرض بيانات الاشتراك');
    }
}

// عرض بيانات العنوان
function displayAddressData() {
    const addressDiv = document.getElementById('addressDetails');
    const address = subscriptionData.address || {};
    
    let addressHTML = `
        <div><strong>النوع:</strong> ${subscriptionData.addressType === 'house' ? 'بيت' : 'شقة'}</div>
        <div><strong>المنطقة:</strong> ${address.area || 'غير محدد'}</div>
        <div><strong>القطعة:</strong> ${address.block || 'غير محدد'}</div>
        <div><strong>الشارع:</strong> ${address.street || 'غير محدد'}</div>
    `;
    
    if (address.avenue) {
        addressHTML += `<div><strong>الجادة:</strong> ${address.avenue}</div>`;
    }
    
    if (subscriptionData.addressType === 'house') {
        addressHTML += `<div><strong>رقم المنزل:</strong> ${address.houseNumber || 'غير محدد'}</div>`;
    } else {
        addressHTML += `
            <div><strong>البناية:</strong> ${address.buildingName || 'غير محدد'}</div>
            <div><strong>الطابق:</strong> ${address.floor || 'غير محدد'}</div>
            <div><strong>الشقة:</strong> ${address.apartment || 'غير محدد'}</div>
        `;
    }
    
    if (address.nearbyBuilding) {
        addressHTML += `<div><strong>مبنى مجاور:</strong> ${address.nearbyBuilding}</div>`;
    }
    
    addressDiv.innerHTML = addressHTML;
}

// عرض تفاصيل الاشتراك
function displaySubscriptionDetails() {
    const subscription = subscriptionData.subscription || {};
    
    document.getElementById('subscriptionName').textContent = subscription.name || 'غير محدد';
    document.getElementById('subscriptionPeriod').textContent = getPeriodText(subscriptionData.period);
    
    // تنسيق التاريخ
    if (subscriptionData.startDate) {
        const startDate = new Date(subscriptionData.startDate);
        document.getElementById('startDate').textContent = startDate.toLocaleDateString('ar-EG', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            calendar: 'gregory' 
        });
    }
    
    document.getElementById('deliveryTime').textContent = subscriptionData.deliveryTime || 'غير محدد';
    document.getElementById('subscriptionPrice').textContent = subscriptionData.price || '0';
    document.getElementById('deliveryPrice').textContent = subscriptionData.deliveryPrice || '0';
    document.getElementById('totalPrice').textContent = subscriptionData.totalPrice || '0';
}

// عرض الأيام المستبعدة
function displayExcludedDays() {
    if (subscriptionData.excludedDays && subscriptionData.excludedDays.length > 0) {
        const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
        const excludedDaysText = subscriptionData.excludedDays.map(day => weekDays[day] || `يوم ${day}`).join(', ');
        document.getElementById('excludedDays').textContent = excludedDaysText;
        document.getElementById('excludedDaysDiv').classList.remove('hidden');
    }
}

// عرض صورة الاشتراك
function displaySubscriptionImage() {
    if (subscriptionData.subscription && subscriptionData.subscription.image) {
        document.getElementById('subscriptionImage').src = subscriptionData.subscription.image;
        document.getElementById('subscriptionImageDiv').classList.remove('hidden');
    }
}

// الحصول على نص الفترة
function getPeriodText(period) {
    const periods = {
        'week': 'أسبوع',
        'twoWeeks': 'أسبوعين',
        'fourWeeks': '٤ أسابيع',
        'month': 'شهر',
        'tenDays': '١٠ أيام',
        'twentyDays': '٢٠ يوم',
        'thirtyDays': '٣٠ يوم',
        'custom': 'مخصص'
    };
    return periods[period] || period || 'غير محدد';
}

// فتح نافذة الصورة
function openImageModal() {
    if (subscriptionData && subscriptionData.subscription && subscriptionData.subscription.image) {
        const modalImage = document.getElementById('modalImage');
        modalImage.src = subscriptionData.subscription.image;
        document.getElementById('imageModal').classList.remove('hidden');
    }
}

// إغلاق نافذة الصورة
function closeImageModal() {
    document.getElementById('imageModal').classList.add('hidden');
}

// إغلاق نافذة النجاح
function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
}

// تهيئة الصفحة
window.addEventListener('load', function() {
    console.log('Page loaded, initializing...');
    
    customerId = getCustomerIdFromURL();
    console.log('Customer ID:', customerId);
    
    if (!customerId) {
        showError('رابط غير صحيح', 'لم يتم تمرير معرف العميل في الرابط');
        return;
    }

    // تهيئة لوحة التوقيع
    setTimeout(() => {
        initSignaturePad();
    }, 100);
    
    // تحميل بيانات الاشتراك
    loadSubscriptionData();
    
    // مراقبة تغيير checkbox الشروط والأحكام
    const agreeTerms = document.getElementById('agreeTerms');
    if (agreeTerms) {
        agreeTerms.addEventListener('change', updateSaveButton);
    }
});

// تحديث حجم الكانفاس عند تغيير حجم النافذة
window.addEventListener('resize', function() {
    if (canvas && ctx) {
        setTimeout(() => {
            resizeCanvas();
        }, 100);
    }
});
