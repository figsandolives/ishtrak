
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

let signaturePad = null;
let subscriptionData = null;

// الحصول على معرف العميل من الرابط
function getCustomerId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('customer');
}

// تحميل بيانات الاشتراك
async function loadSubscriptionData() {
    const customerId = getCustomerId();
    if (!customerId) {
        document.body.innerHTML = `
            <h2>رابط غير صحيح</h2>
            <p>يرجى التأكد من الرابط والمحاولة مرة أخرى.</p>
        `;
        return;
    }

    try {
        const doc = await db.collection('subscriptions').doc(customerId).get();
        if (!doc.exists) {
            document.body.innerHTML = `
                <h2>الاشتراك غير موجود</h2>
                <p>لم يتم العثور على بيانات الاشتراك.</p>
            `;
            return;
        }

        subscriptionData = { id: doc.id, ...doc.data() };
        displaySubscriptionData();
        initializeSignaturePad();
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
        document.body.innerHTML = `
            <h2>خطأ في التحميل</h2>
            <p>حدث خطأ في تحميل بيانات الاشتراك.</p>
        `;
    }
}


// عرض بيانات الاشتراك
function displaySubscriptionData() {
    const summaryDiv = document.getElementById('subscription-summary');
    const imageContainer = document.getElementById('meal-plan-image-container');
    
    // عرض ملخص الاشتراك
    summaryDiv.innerHTML = `
        

            
بيانات الاشتراك

            

                

                    اسم العميل: ${subscriptionData.customerName}
                

                

                    رقم الهاتف: ${subscriptionData.phoneNumber}
                

                

                    نوع الاشتراك: ${subscriptionData.subscription.name}
                

                

                    المدة: ${getPeriodText(subscriptionData.period)}
                

                

                    تاريخ البدء: ${new Date(subscriptionData.startDate).toLocaleDateString('ar-EG', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric', 
                        calendar: 'gregory' 
                    })}
                

                

                    وقت التوصيل: ${subscriptionData.deliveryTime}
                

                

                    العنوان: ${formatAddress(subscriptionData.address, subscriptionData.addressType)}
                

                

                    السعر الإجمالي: ${subscriptionData.totalPrice} د.ك
                

                ${subscriptionData.excludedDays && subscriptionData.excludedDays.length > 0 ? `
                

                    الأيام المستبعدة: ${subscriptionData.excludedDays.map(day => 
                        ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'][day]
                    ).join(', ')}
                

                ` : ''}
            

        

    `;
    
    // عرض صورة جدول الاشتراك
    if (subscriptionData.subscription.image) {
        imageContainer.innerHTML = `
            
جدول الاشتراك

            جدول الاشتراك
        `;
    }
}

// تنسيق العنوان
function formatAddress(address, type) {
    let formattedAddress = `${address.area}, قطعة ${address.block}, شارع ${address.street}`;
    
    if (address.avenue) {
        formattedAddress += `, جادة ${address.avenue}`;
    }
    
    if (type === 'house') {
        formattedAddress += `, منزل رقم ${address.houseNumber}`;
    } else {
        formattedAddress += `, بناية ${address.buildingName}, طابق ${address.floor}, شقة ${address.apartment}`;
    }
    
    if (address.nearbyBuilding) {
        formattedAddress += `, قرب ${address.nearbyBuilding}`;
    }
    
    return formattedAddress;
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

// تهيئة لوحة التوقيع
function initializeSignaturePad() {
    const canvas = document.getElementById('signature-pad');
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: '#f8f8f8',
        penColor: '#000000',
        minWidth: 1,
        maxWidth: 3
    });
    
    // تفعيل زر الاعتماد عند التوقيع
    signaturePad.addEventListener('beginStroke', () => {
        document.getElementById('approve-btn').disabled = false;
    });
    
    // زر مسح التوقيع
    document.getElementById('clear-signature-btn').addEventListener('click', () => {
        signaturePad.clear();
        document.getElementById('approve-btn').disabled = true;
    });
    
    // زر الاعتماد
    document.getElementById('approve-btn').addEventListener('click', approveSubscription);
}

// اعتماد الاشتراك
async function approveSubscription() {
    if (signaturePad.isEmpty()) {
        alert('يرجى التوقيع أولاً');
        return;
    }
    
    try {
        // تحويل التوقيع إلى صورة
        const signatureDataURL = signaturePad.toDataURL();
        
        // رفع التوقيع إلى Firebase Storage
        const signatureBlob = dataURLtoBlob(signatureDataURL);
        const signatureRef = storage.ref().child(`signatures/${subscriptionData.id}.png`);
        const uploadTask = await signatureRef.put(signatureBlob);
        const signatureURL = await uploadTask.ref.getDownloadURL();
        
        // تحديث بيانات الاشتراك
        await db.collection('subscriptions').doc(subscriptionData.id).update({
            status: 'approved',
            signatureURL: signatureURL,
            approvedAt: new Date()
        });
        
        // إظهار رسالة النجاح
        document.body.innerHTML = `
            

                
✅

                
تم اعتماد الاشتراك بنجاح!

                
شكراً لثقتكم بنا. سيتم التواصل معكم قريباً لتأكيد موعد بدء التوصيل.


                

                    
للاستفسارات:


                    
📞 هاتف: 1234567890


                    
📧 بريد إلكتروني: info@example.com


                

            

        `;
        
    } catch (error) {
        console.error('خطأ في اعتماد الاشتراك:', error);
        alert('حدث خطأ في اعتماد الاشتراك. يرجى المحاولة مرة أخرى.');
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

// تحميل البيانات عند تحميل الصفحة
window.addEventListener('load', loadSubscriptionData);
