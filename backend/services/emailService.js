const nodemailer = require('nodemailer');

// Setup transporter safely
const createTransporter = () => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return null; // Email disabled safely
    }
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const getStatusEmailTemplate = (requestType, status, clientName, portalUrl) => {
    // Generate Arabic subject and explanation based on status
    let subject = '';
    let explanation = '';
    let statusLabel = '';

    if (requestType === 'installation') {
        switch(status) {
            case 'new_request':
                statusLabel = 'طلب جديد';
                subject = 'تم استلام طلب التركيب الخاص بك';
                explanation = 'لقد استلمنا طلب التركيب الخاص بك. سيقوم فريقنا بمراجعته قريباً.';
                break;
            case 'under_review':
                statusLabel = 'قيد المراجعة';
                subject = 'طلب التركيب الخاص بك قيد المراجعة';
                explanation = 'فريقنا يقوم حالياً بمراجعة طلبك وسيتم تحديد الخطوة التالية قريباً.';
                break;
            case 'site_visit_scheduled':
                statusLabel = 'تم جدولة زيارة ميدانية';
                subject = 'تم جدولة زيارة ميدانية لموقعك';
                explanation = 'تمت جدولة زيارة ميدانية لموقعك لتقييم الاحتياجات الفنية.';
                break;
            case 'site_inspection_done':
                statusLabel = 'تمت المعاينة';
                subject = 'اكتملت المعاينة الميدانية';
                explanation = 'تم الانتهاء من المعاينة الميدانية بنجاح. سنقوم بإعداد عرض السعر قريباً.';
                break;
            case 'quote_prepared':
                statusLabel = 'تم تجهيز العرض';
                subject = 'عرض السعر جاهز';
                explanation = 'تم تجهيز عرض السعر الخاص بك. يمكنك مراجعته الآن عبر بوابة العميل.';
                break;
            case 'awaiting_client_approval':
                statusLabel = 'في انتظار الموافقة';
                subject = 'نحن في انتظار موافقتك على العرض';
                explanation = 'نرجو منك التفضل بمراجعة عرض السعر والموافقة عليه لنتمكن من المتابعة.';
                break;
            case 'approved':
                statusLabel = 'تمت الموافقة';
                subject = 'تمت الموافقة على طلبك';
                explanation = 'شكراً لموافقتك. سيتم جدولة عملية التركيب في أقرب وقت.';
                break;
            case 'installation_scheduled':
                statusLabel = 'تم جدولة التركيب';
                subject = 'تم تحديد موعد التركيب';
                explanation = 'تم تحديد موعد لتركيب النظام الشمسي الخاص بك.';
                break;
            case 'in_progress':
                statusLabel = 'قيد التنفيذ';
                subject = 'عملية التركيب قيد التنفيذ';
                explanation = 'فريقنا التقني يعمل حالياً على تركيب النظام الخاص بك.';
                break;
            case 'completed':
                statusLabel = 'مكتمل';
                subject = 'اكتملت عملية التركيب';
                explanation = 'تم الانتهاء من عملية التركيب بنجاح. نتمنى لك تجربة ممتازة مع الطاقة النظيفة.';
                break;
            case 'follow_up':
                statusLabel = 'متابعة';
                subject = 'متابعة ما بعد التركيب';
                explanation = 'نحن هنا لمتابعة أداء نظامك الشمسي وضمان عمله بكفاءة.';
                break;
            default:
                statusLabel = status;
                subject = 'تحديث على طلب التركيب الخاص بك';
                explanation = 'تم تحديث حالة طلبك. يرجى مراجعة البوابة للتفاصيل.';
        }
    } else if (requestType === 'maintenance') {
        switch(status) {
            case 'new_request':
                statusLabel = 'طلب جديد';
                subject = 'تم استلام طلب الصيانة الخاص بك';
                explanation = 'لقد استلمنا طلب الصيانة الخاص بك وجاري معالجته.';
                break;
            case 'initial_diagnosis':
                statusLabel = 'التشخيص الأولي';
                subject = 'جاري التشخيص الأولي لطلب الصيانة';
                explanation = 'يقوم فريقنا حالياً بإجراء التشخيص الأولي للمشكلة المبلغ عنها.';
                break;
            case 'visit_scheduled':
                statusLabel = 'تم جدولة زيارة';
                subject = 'تم تحديد موعد لزيارة الصيانة';
                explanation = 'تمت جدولة زيارة فنية لموقعك لإجراء الصيانة اللازمة.';
                break;
            case 'in_progress':
                statusLabel = 'قيد التنفيذ';
                subject = 'أعمال الصيانة قيد التنفيذ';
                explanation = 'أعمال الصيانة الخاصة بنظامك قيد التنفيذ حالياً.';
                break;
            case 'resolved':
                statusLabel = 'تم الحل';
                subject = 'تم حل مشكلة الصيانة';
                explanation = 'لقد تم الانتهاء من الصيانة وحل المشكلة بنجاح.';
                break;
            case 'closed':
                statusLabel = 'مغلق';
                subject = 'تم إغلاق طلب الصيانة';
                explanation = 'تم إغلاق طلب الصيانة الخاص بك. شكراً لتعاملك مع سولارا.';
                break;
            default:
                statusLabel = status;
                subject = 'تحديث على طلب الصيانة الخاص بك';
                explanation = 'تم تحديث حالة طلب الصيانة الخاص بك. يرجى مراجعة البوابة للتفاصيل.';
        }
    }

    const html = `
    <div dir="rtl" style="font-family: 'Cairo', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #041612; padding: 20px; text-align: center;">
            <h1 style="color: #FFB800; margin: 0; font-size: 24px;">سولارا 2026</h1>
            <p style="color: #F1F5F9; margin: 5px 0 0 0; font-size: 14px;">الطاقة الشمسية النظيفة للجزائر</p>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
            <h2 style="color: #041612; margin-top: 0;">مرحباً ${clientName || 'عميلنا العزيز'}،</h2>
            <p style="font-size: 16px; line-height: 1.6;">${explanation}</p>
            
            <div style="background-color: #fff; padding: 15px; border-radius: 6px; border-right: 4px solid #FFB800; margin: 25px 0;">
                <p style="margin: 0; font-weight: bold;">الحالة الجديدة: <span style="color: #062C24;">${statusLabel}</span></p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
                <a href="${portalUrl}" style="background-color: #FFB800; color: #041612; text-decoration: none; padding: 12px 25px; border-radius: 5px; font-weight: bold; display: inline-block;">مراجعة طلبي في البوابة</a>
            </div>
        </div>
        <div style="background-color: #eeeeee; padding: 15px; text-align: center; font-size: 12px; color: #777;">
            <p style="margin: 0;">هذه رسالة تلقائية، يرجى عدم الرد عليها.</p>
            <p style="margin: 5px 0 0 0;">&copy; 2026 سولارا. جميع الحقوق محفوظة.</p>
        </div>
    </div>
    `;

    return { subject, html };
};

const sendStatusEmail = async (toEmail, clientName, requestType, newStatus) => {
    if (!toEmail) return { success: false, message: 'No email provided' };

    const transporter = createTransporter();
    if (!transporter) {
        console.log("Email notifications disabled: missing SMTP config");
        return { success: false, message: 'SMTP not configured' };
    }

    const portalUrl = process.env.PORTAL_URL || 'http://localhost:3000/portal.html';
    const { subject, html } = getStatusEmailTemplate(requestType, newStatus, clientName, portalUrl);

    try {
        await transporter.sendMail({
            from: `"Solara 2026" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
            to: toEmail,
            subject: subject,
            html: html,
        });
        console.log(`✅ Email sent to ${toEmail} for status ${newStatus}`);
        return { success: true };
    } catch (error) {
        console.error("❌ Failed to send status email:", error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { sendStatusEmail };
