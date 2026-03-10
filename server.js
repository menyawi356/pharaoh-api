const express = require('express');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
// للسماح باستقبال البيانات وتخطي مشاكل الـ CORS
app.use(express.json());
app.use(cors());

// ==========================================
// 1. الاتصال بقاعدة البيانات الخاصة بك
// ==========================================
const mongoURI = 'mongodb+srv://1024121mohamed_db_user:Fh93H8938QYOUMYx@pharaoh.rnoclho.mongodb.net/pharaoh_db?retryWrites=true&w=majority';

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('تم الاتصال بقاعدة بيانات MongoDB بنجاح!');
}).catch((err) => {
    console.error('حدث خطأ أثناء الاتصال بقاعدة البيانات:', err);
});

// ==========================================
// 2. إنشاء نموذج (Schema) لحفظ البيانات المهمة فقط ومنع التكرار
// ==========================================
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true }, // 'unique: true' تمنع تسجيل نفس الإيميل مرة أخرى
    phone: { type: String } // يمكنك إضافة أي حقول أخرى تراها ضرورية فقط
});
const User = mongoose.model('User', userSchema);

// ==========================================
// 3. إعداد نظام إرسال الإيميلات للفريق
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail', // يمكنك تغييره حسب مزود الإيميل الخاص بك
    auth: {
        user: 'your_email@gmail.com', // ضع إيميل المرسل هنا
        pass: 'your_email_password_or_app_password' // ضع كلمة مرور الإيميل (أو App Password)
    }
});

// ==========================================
// 4. مسار التسجيل (API Route)
// ==========================================
app.post('/register', async (req, res) => {
    try {
        // نأخذ البيانات التي لها لزمة فقط ونتجاهل الباقي
        const { name, email, phone } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'يرجى إدخال الاسم والإيميل' });
        }

        // فحص ما إذا كان المستخدم مسجل مسبقاً (لمنع التكرار)
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: 'هذا الحساب مسجل لدينا بالفعل ولا يمكن تكراره!' });
        }

        // حفظ البيانات في قاعدة البيانات
        const newUser = new User({ name, email, phone });
        await newUser.save();

        // إرسال إيميل للفريق بأن هناك شخص جديد سجل
        const mailOptions = {
            from: 'your_email@gmail.com',
            to: 'team_email@example.com', // الإيميل الذي سيستقبل عليه الفريق الإشعار
            subject: 'تسجيل جديد في الموقع!',
            text: `تم تسجيل عضو جديد بنجاح.\n\nالاسم: ${name}\nالإيميل: ${email}\nرقم الهاتف: ${phone || 'غير متوفر'}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('خطأ في إرسال إيميل الإشعار للفريق:', error);
            } else {
                console.log('تم إرسال الإيميل للفريق بنجاح:', info.response);
            }
        });

        // إرسال رد بنجاح العملية
        res.status(201).json({ message: 'تم التسجيل بنجاح وتم إبلاغ الفريق!' });

    } catch (error) {
        // إذا كان الخطأ بسبب التكرار (من قاعدة البيانات نفسها)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'البيانات مكررة ولا يمكن تسجيلها مرة أخرى!' });
        }
        res.status(500).json({ message: 'حدث خطأ في الخادم', error: error.message });
    }
});

// ==========================================
// 5. تشغيل الخادم
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`الموقع متصل والخادم يعمل على المنفذ ${PORT}`);
});