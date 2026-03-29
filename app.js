const firebaseConfig = {
    apiKey: "AIzaSyDKSgnkag4jXFqsuaMnwAB_fPrKXaTSqFI",
    authDomain: "ishrtakat.firebaseapp.com",
    databaseURL: "https://ishrtakat-default-rtdb.firebaseio.com",
    projectId: "ishrtakat",
    storageBucket: "ishrtakat.firebasestorage.app",
    messagingSenderId: "736083445316",
    appId: "1:736083445316:web:db45ddda266bd297745e11",
    measurementId: "G-FVCQGP662P"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const EXCLUDED_DAY_NAMES = ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
const PERIOD_NAMES = {
    week: 'أسبوع',
    twoWeeks: 'أسبوعين',
    fourWeeks: '٤ أسابيع',
    month: 'شهر',
    tenDays: '١٠ أيام',
    twentyDays: '٢٠ يوم',
    thirtyDays: '٣٠ يوم',
    custom: 'مخصص'
};

let currentCustomerId = null;
let currentSubscription = null;
let signaturePad = null;
let signatureCtx = null;
let isDrawing = false;
let hasSignature = false;
let signatureDataUrl = null;

function getFirebaseErrorMessage(error, operation = 'تنفيذ العملية') {
    const errorCode = error?.code || '';
    const errorMessage = error?.message || '';

    if (errorCode === 'permission-denied' && errorMessage.includes('suspended')) {
        return 'تعذر الوصول إلى مشروع Firebase لأن المشروع المرتبط بصفحة التوقيع موقوف. تأكد من نشر آخر نسخة من app.js وsign.html المرتبطتين بالمشروع الجديد.';
    }

    if (
        errorMessage.includes('Cloud Firestore API has not been used') ||
        errorMessage.includes('firestore.googleapis.com')
    ) {
        return 'تعذر تحميل الاستمارة لأن Cloud Firestore غير مفعّل في مشروع Firebase الحالي. فعّل Firestore ثم أعد المحاولة.';
    }

    if (errorCode === 'permission-denied') {
        return 'تم رفض الوصول إلى بيانات الاستمارة. تأكد من قواعد Firestore وصلاحيات القراءة والكتابة.';
    }

    if (errorCode === 'unavailable' || errorMessage.includes('offline')) {
        return 'تعذر الاتصال بقاعدة البيانات حاليًا. تحقق من الإنترنت ثم أعد المحاولة.';
    }

    return `حدث خطأ أثناء ${operation}${errorMessage ? `: ${errorMessage}` : '.'}`;
}

function showScreen(screen) {
    document.getElementById('loadingScreen').classList.toggle('hidden', screen !== 'loading');
    document.getElementById('errorScreen').classList.toggle('hidden', screen !== 'error');
    document.getElementById('mainContent').classList.toggle('hidden', screen !== 'main');
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    showScreen('error');
}

function formatDate(dateValue) {
    if (!dateValue) {
        return 'غير محدد';
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        calendar: 'gregory'
    });
}

function formatDeliveryTimeRange(timeRange) {
    if (!timeRange || !timeRange.includes('-')) {
        return timeRange || 'غير محدد';
    }

    const [start, end] = timeRange.split('-');
    let startHour = parseInt(start, 10);
    let endHour = parseInt(end, 10);

    if (Number.isNaN(startHour) || Number.isNaN(endHour)) {
        return timeRange;
    }

    let startPeriod = startHour < 12 ? 'صباحاً' : 'ظهراً';
    let endPeriod = endHour < 12 ? 'صباحاً' : (endHour === 12 ? 'ظهراً' : 'مساءً');

    let start12 = startHour > 12 ? startHour - 12 : startHour;
    let end12 = endHour > 12 ? endHour - 12 : endHour;

    if (start12 === 0) start12 = 12;
    if (end12 === 0) end12 = 12;
    if (startHour === 12) startPeriod = 'ظهراً';
    if (endHour === 12) endPeriod = 'ظهراً';

    const toArabicNumerals = (num) => num.toString().replace(/\d/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[digit]);
    return `من ${toArabicNumerals(start12)} ${startPeriod} إلى ${toArabicNumerals(end12)} ${endPeriod}`;
}

function getPeriodText(period) {
    return PERIOD_NAMES[period] || period || 'غير محدد';
}

function getExcludedDaysText(days) {
    if (!Array.isArray(days) || days.length === 0) {
        return '';
    }

    return [...new Set(days)]
        .map((dayIndex) => EXCLUDED_DAY_NAMES[dayIndex] || dayIndex)
        .join('، ');
}

function renderAddressDetails(data) {
    if (!data?.address) {
        document.getElementById('addressDetails').innerHTML = '<div>لا توجد بيانات عنوان</div>';
        return;
    }

    const address = data.address;
    let html = `
        <div><strong>نوع العنوان:</strong> ${data.addressType === 'house' ? 'بيت' : 'شقة'}</div>
        <div><strong>المنطقة:</strong> ${address.area || 'غير محدد'}</div>
        <div><strong>القطعة:</strong> ${address.block || 'غير محدد'}</div>
        <div><strong>الشارع:</strong> ${address.street || 'غير محدد'}</div>
    `;

    if (address.avenue) {
        html += `<div><strong>الجادة:</strong> ${address.avenue}</div>`;
    }

    if (data.addressType === 'house') {
        html += `<div><strong>رقم المنزل:</strong> ${address.houseNumber || 'غير محدد'}</div>`;
    } else {
        html += `
            <div><strong>البناية:</strong> ${address.buildingName || 'غير محدد'}</div>
            <div><strong>الطابق:</strong> ${address.floor || 'غير محدد'}</div>
            <div><strong>الشقة:</strong> ${address.apartment || 'غير محدد'}</div>
        `;
    }

    if (address.nearbyBuilding) {
        html += `<div class="md:col-span-2"><strong>مبنى مجاور:</strong> ${address.nearbyBuilding}</div>`;
    }

    document.getElementById('addressDetails').innerHTML = html;
}

function renderSubscriptionData(docId, data) {
    currentSubscription = { id: docId, ...data };

    document.getElementById('customerName').textContent = data.customerName || 'غير محدد';
    document.getElementById('phoneNumber').textContent = data.phoneNumber || 'غير محدد';
    document.getElementById('subscriptionName').textContent = data.subscription?.name || 'غير محدد';
    document.getElementById('subscriptionPeriod').textContent = getPeriodText(data.period);
    document.getElementById('startDate').textContent = formatDate(data.startDate);
    document.getElementById('deliveryTime').textContent = formatDeliveryTimeRange(data.deliveryTime);
    document.getElementById('subscriptionPrice').textContent = data.price ?? 0;
    document.getElementById('deliveryPrice').textContent = data.deliveryPrice ?? 0;
    document.getElementById('totalPrice').textContent = data.totalPrice ?? 0;

    renderAddressDetails(data);

    const excludedDaysText = getExcludedDaysText(data.excludedDays);
    if (excludedDaysText) {
        document.getElementById('excludedDays').textContent = excludedDaysText;
        document.getElementById('excludedDaysDiv').classList.remove('hidden');
    } else {
        document.getElementById('excludedDaysDiv').classList.add('hidden');
    }

    const subscriptionImageDiv = document.getElementById('subscriptionImageDiv');
    const subscriptionImage = document.getElementById('subscriptionImage');
    if (data.subscription?.image) {
        subscriptionImage.src = data.subscription.image;
        subscriptionImageDiv.classList.remove('hidden');
        subscriptionImage.onerror = () => {
            subscriptionImageDiv.classList.add('hidden');
        };
    } else {
        subscriptionImageDiv.classList.add('hidden');
    }

    if (data.signatureURL) {
        signatureDataUrl = data.signatureURL;
        hasSignature = true;
        drawSignatureImage(signatureDataUrl);
    }

    if (data.status === 'approved') {
        document.getElementById('agreeTerms').checked = true;
        document.getElementById('agreeTerms').disabled = true;
        document.getElementById('saveBtn').textContent = 'تم الاعتماد';
        document.getElementById('signatureStatus').textContent = 'تم اعتماد هذه الاستمارة مسبقًا.';
    } else {
        document.getElementById('signatureStatus').textContent = 'يرجى التوقيع والموافقة على الشروط لتفعيل زر الاعتماد';
    }

    updateSaveButtonState();
}

function updateSaveButtonState() {
    const agreeTerms = document.getElementById('agreeTerms');
    const saveBtn = document.getElementById('saveBtn');
    const signatureStatus = document.getElementById('signatureStatus');
    const alreadyApproved = currentSubscription?.status === 'approved';

    const canSave = Boolean(currentSubscription) && !alreadyApproved && agreeTerms.checked && hasSignature;
    saveBtn.disabled = !canSave;

    if (alreadyApproved) {
        signatureStatus.textContent = 'تم اعتماد هذه الاستمارة مسبقًا.';
        return;
    }

    if (!agreeTerms.checked && !hasSignature) {
        signatureStatus.textContent = 'يرجى التوقيع والموافقة على الشروط لتفعيل زر الاعتماد';
        return;
    }

    if (!agreeTerms.checked) {
        signatureStatus.textContent = 'يرجى الموافقة على الشروط والأحكام أولاً';
        return;
    }

    if (!hasSignature) {
        signatureStatus.textContent = 'يرجى التوقيع داخل المربع أولاً';
        return;
    }

    signatureStatus.textContent = 'البيانات مكتملة ويمكن اعتماد الاشتراك الآن';
}

function clearCanvasSurface() {
    if (!signatureCtx || !signaturePad) {
        return;
    }

    signatureCtx.clearRect(0, 0, signaturePad.width, signaturePad.height);
}

function drawSignatureImage(dataUrl) {
    if (!dataUrl || !signaturePad) {
        return;
    }

    const image = new Image();
    image.onload = () => {
        clearCanvasSurface();
        const canvasWidth = signaturePad.width;
        const canvasHeight = signaturePad.height;
        const ratio = Math.min(canvasWidth / image.width, canvasHeight / image.height);
        const drawWidth = image.width * ratio;
        const drawHeight = image.height * ratio;
        const offsetX = (canvasWidth - drawWidth) / 2;
        const offsetY = (canvasHeight - drawHeight) / 2;

        signatureCtx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
        signaturePad.classList.add('signed');
    };
    image.src = dataUrl;
}

function resizeSignaturePad() {
    if (!signaturePad) {
        return;
    }

    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = signaturePad.getBoundingClientRect();
    const width = Math.max(Math.floor(rect.width * ratio), 1);
    const height = Math.max(Math.floor(rect.height * ratio), 1);

    signaturePad.width = width;
    signaturePad.height = height;
    signatureCtx = signaturePad.getContext('2d');
    signatureCtx.lineCap = 'round';
    signatureCtx.lineJoin = 'round';
    signatureCtx.lineWidth = 2.5 * ratio;
    signatureCtx.strokeStyle = '#111827';

    if (signatureDataUrl) {
        drawSignatureImage(signatureDataUrl);
    } else {
        clearCanvasSurface();
    }
}

function getCanvasPosition(event) {
    const rect = signaturePad.getBoundingClientRect();
    const scaleX = signaturePad.width / rect.width;
    const scaleY = signaturePad.height / rect.height;

    return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY
    };
}

function startDrawing(event) {
    if (currentSubscription?.status === 'approved') {
        return;
    }

    isDrawing = true;
    const position = getCanvasPosition(event);
    signatureCtx.beginPath();
    signatureCtx.moveTo(position.x, position.y);
    event.preventDefault();
}

function draw(event) {
    if (!isDrawing || currentSubscription?.status === 'approved') {
        return;
    }

    const position = getCanvasPosition(event);
    signatureCtx.lineTo(position.x, position.y);
    signatureCtx.stroke();
    hasSignature = true;
    signaturePad.classList.add('signed');
    event.preventDefault();
}

function stopDrawing() {
    if (!isDrawing) {
        return;
    }

    isDrawing = false;
    signatureCtx.closePath();
    signatureDataUrl = signaturePad.toDataURL('image/png');
    updateSaveButtonState();
}

function initializeSignaturePad() {
    signaturePad = document.getElementById('signaturePad');
    resizeSignaturePad();

    signaturePad.addEventListener('pointerdown', startDrawing);
    signaturePad.addEventListener('pointermove', draw);
    signaturePad.addEventListener('pointerup', stopDrawing);
    signaturePad.addEventListener('pointerleave', stopDrawing);
    signaturePad.addEventListener('pointercancel', stopDrawing);

    window.addEventListener('resize', resizeSignaturePad);
    console.log('Signature pad initialized successfully');
}

function openImageModal() {
    const modal = document.getElementById('imageModal');
    document.getElementById('modalImage').src = document.getElementById('subscriptionImage').src;
    modal.classList.remove('hidden');
}

function closeImageModal() {
    document.getElementById('imageModal').classList.add('hidden');
}

function closeSuccessModal() {
    document.getElementById('successModal').classList.add('hidden');
}

function clearSignature() {
    if (currentSubscription?.status === 'approved') {
        return;
    }

    signatureDataUrl = null;
    hasSignature = false;
    clearCanvasSurface();
    signaturePad.classList.remove('signed');
    updateSaveButtonState();
}

async function loadSubscriptionData(customerId) {
    console.log('Loading subscription data for customer:', customerId);

    try {
        const doc = await db.collection('subscriptions').doc(customerId).get();

        if (!doc.exists) {
            showError('لم يتم العثور على الاستمارة المطلوبة. تأكد من أن الرابط صحيح.');
            return;
        }

        renderSubscriptionData(doc.id, doc.data());
        showScreen('main');
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        showError(getFirebaseErrorMessage(error, 'تحميل بيانات الاشتراك'));
    }
}

async function saveSignature() {
    if (!currentCustomerId || !currentSubscription) {
        showError('تعذر تحديد الاستمارة المطلوبة.');
        return;
    }

    if (currentSubscription.status === 'approved') {
        closeSuccessModal();
        return;
    }

    if (!document.getElementById('agreeTerms').checked) {
        alert('يرجى الموافقة على الشروط والأحكام أولاً.');
        return;
    }

    if (!hasSignature || !signatureDataUrl) {
        alert('يرجى التوقيع قبل اعتماد الاشتراك.');
        return;
    }

    const saveBtn = document.getElementById('saveBtn');
    const originalText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'جاري الحفظ...';

    try {
        await db.collection('subscriptions').doc(currentCustomerId).update({
            status: 'approved',
            signatureURL: signatureDataUrl,
            agreedToTerms: true,
            approvedAt: new Date()
        });

        currentSubscription.status = 'approved';
        document.getElementById('agreeTerms').disabled = true;
        document.getElementById('successModal').classList.remove('hidden');
        document.getElementById('signatureStatus').textContent = 'تم اعتماد الاشتراك بنجاح.';
        saveBtn.textContent = 'تم الاعتماد';
        updateSaveButtonState();
    } catch (error) {
        console.error('خطأ في حفظ التوقيع:', error);
        alert(getFirebaseErrorMessage(error, 'اعتماد الاشتراك'));
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, initializing...');
    initializeSignaturePad();

    document.getElementById('agreeTerms').addEventListener('change', updateSaveButtonState);

    const customerId = new URLSearchParams(window.location.search).get('customer');
    currentCustomerId = customerId;
    console.log('Customer ID:', customerId);

    if (!customerId) {
        showError('الرابط غير مكتمل. لم يتم العثور على معرف العميل.');
        return;
    }

    loadSubscriptionData(customerId);
});

window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.closeSuccessModal = closeSuccessModal;
window.clearSignature = clearSignature;
window.saveSignature = saveSignature;
