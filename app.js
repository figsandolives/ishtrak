
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

// الحصول على معرف العميل من الرابط
function getCustomerIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('customer');
}

// تهيئة لوحة التوقيع
function initSignaturePad() {
    canvas = document.getElementById('signaturePad');
    ctx = canvas.getContext('2d');
    
    // تعيين حجم الكانفاس
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
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
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
}

// بدء الرسم
function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) / 2;
    const y = (e.clientY - rect.top) * (canvas.height / rect.height) / 2;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
}

// الرسم
function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width) / 2;
    const y = (e.clientY - rect.top) * (canvas.height / rect.height) / 2;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    hasSignature = true;
    updateSaveButton();
}

// إيقاف الرسم
function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        canvas.classList.add('signed');
    }
}

// التعامل مع اللمس
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                    e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// مسح التوقيع
function clearSignature() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
    canvas.classList.remove('signed');
    updateSaveButton();
}

// تحديث زر الحفظ
function updateSaveButton() {
    const saveBtn = document.getElementById('saveBtn');
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    if (hasSignature && agreeTerms) {
        saveBtn.disabled = false;
    } else {
        saveBtn.disabled = true;
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
        const doc = await db.collection('subscriptions').doc(customerId).get();
        
        if (!doc.exists) {
            alert('الاشتراك غير موجود');
            return;
        }

        subscriptionData = doc.data();
        displaySubscriptionData();
        
        // إخفاء شاشة التحميل وإظهار المحتوى
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('mainContent').classList.remove('hidden');

    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        alert('حدث خطأ في تحميل بيانات الاشتراك');
    }
}

// عرض بيانات الاشتراك
function displaySubscriptionData() {
    // بيانات العميل
    document.getElementById('customerName').textContent = subscriptionData.customerName;
    document.getElementById('phoneNumber').textContent = subscriptionData.phoneNumber;

    // العنوان
    const addressDiv = document.getElementById('addressDetails');
    let addressHTML = `
        <div><strong>النوع:</strong> ${subscriptionData.addressType === 'house' ? 'بيت' : 'شقة'}</div>
        <div><strong>المنطقة:</strong> ${subscriptionData.address.area}</div>
        <div><strong>القطعة:</strong> ${subscriptionData.address.block}</div>
        <div><strong>الشارع:</strong> ${subscriptionData.address.street}</div>
    `;
    
    if (subscriptionData.address.avenue) {
        addressHTML += `<div><strong>الجادة:</strong> ${subscriptionData.address.avenue}</div>`;
    }
    
    if (subscriptionData.addressType === 'house') {
        addressHTML += `<div><strong>رقم المنزل:</strong> ${subscriptionData.address.houseNumber}</div>`;
    } else {
        addressHTML += `
            <div><strong>البناية:</strong> ${subscriptionData.address.buildingName}</div>
            <div><strong>الطابق:</strong> ${subscriptionData.address.floor}</div>
            <div><strong>الشقة:</strong> ${subscriptionData.address.apartment}</div>
        `;
    }
    
    if (subscriptionData.address.nearbyBuilding) {
        addressHTML += `<div><strong>مبنى مجاور:</strong> ${subscriptionData.address.nearbyBuilding}</div>`;
    }
    
    addressDiv.innerHTML = addressHTML;

    // تفاصيل الاشتراك
    document.getElementById('subscriptionName').textContent = subscriptionData.subscription.name;
    document.getElementById('subscriptionPeriod').textContent = getPeriodText(subscriptionData.period);
    document.getElementById('startDate').textContent = new Date(subscriptionData.startDate).toLocaleDateString('ar-EG', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        calendar: 'gregory' 
    });
    document.getElementById('deliveryTime').textContent = subscriptionData.deliveryTime;
    document.getElementById('subscriptionPrice').textContent = subscriptionData.price;
    document.getElementById('deliveryPrice').textContent = subscriptionData.deliveryPrice;
    document.getElementById('totalPrice').textContent = subscriptionData.totalPrice;

    // الأيام المستبعدة
    if (subscriptionData.excludedDays && subscriptionData.excludedDays.length > 0) {
        const weekDays = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
        const excludedDaysText = subscriptionData.excludedDays.map(day => weekDays[day]).join(', ');
        document.getElementById('excludedDays').textContent = excludedDaysText;
        document.getElementById('excludedDaysDiv').classList.remove('hidden');
    }

    // صورة الاشتراك
    if (subscriptionData.subscription.image) {
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
    return periods[period] || period;
}

// فتح نافذة الصورة
function openImageModal() {
    const modalImage = document.getElementById('modalImage');
    modalImage.src = subscriptionData.subscription.image;
    document.getElementById('imageModal').classList.remove('hidden');
}

// إغلاق نافذة الصورة
function closeImageModal() {
    document.getElementById('imageModal').classList.add('hidden');
}

// إغلاق نافذة النجاح
function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
    // يمكن إعادة توجيه المستخدم أو إغلاق الصفحة
}

// مراقبة تغيير checkbox الشروط والأحكام
document.getElementById('agreeTerms').addEventListener('change', updateSaveButton);

// تهيئة الصفحة
window.addEventListener('load', function() {
    customerId = getCustomerIdFromURL();
    
    if (!customerId) {
        alert('رابط غير صحيح');
        return;
    }

    initSignaturePad();
    loadSubscriptionData();
});

// تحديث حجم الكانفاس عند تغيير حجم النافذة
window.addEventListener('resize', function() {
    if (canvas) {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
    }
});
