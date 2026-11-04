export const normalizeWhatsAppPhone = (value = "") => {
  if (!value) return "";

  const trimmed = String(value).trim();
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (!digitsOnly) return "";
  if (trimmed.startsWith("+")) return trimmed.replace(/[^\d+]/g, "");
  if (digitsOnly.length === 10) return `+91${digitsOnly}`;
  return `+${digitsOnly}`;
};

export const buildWhatsAppUrl = (phone, message = "") => {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return "";

  const encodedText = encodeURIComponent(message || "");
  const baseUrl = `https://web.whatsapp.com/send/?phone=${encodeURIComponent(normalizedPhone)}`;
  return encodedText ? `${baseUrl}&text=${encodedText}` : baseUrl;
};

export const buildAppointmentMessage = (appointment = {}, mode = "booking", hospitalContact = "") => {
  const lines = [];
  const contactValue = hospitalContact || "";
  const normalizedMode = String(mode || "booking");
  const isReminder = normalizedMode === "reminder" || normalizedMode.startsWith("reminder");
  const reminderHeading = normalizedMode === "reminder-1day"
    ? "Appointment Reminder (1 Day Before)"
    : normalizedMode === "reminder-2hours"
      ? "Appointment Reminder (2 Hours Before)"
      : "Appointment Reminder";

  lines.push("🏥 *Annandi Hospital*");
  lines.push("");

  if (isReminder) {
    lines.push(`⏰ *${reminderHeading}*`);
    lines.push("");
    lines.push(`Dear *${appointment.patientName || "Patient"}*,`);
    lines.push("This is a friendly reminder about your upcoming appointment.");
  } else {
    lines.push("✅ *Appointment Confirmed*");
    lines.push("");
    lines.push(`Dear *${appointment.patientName || "Patient"}*,`);
    lines.push("Your appointment has been successfully booked.");
  }

  lines.push("");
  lines.push("📋 *Appointment Details*");
  lines.push(`👨‍⚕️ Doctor : *${appointment.doctorName || "N/A"}*`);
  lines.push(`📅 Date : *${appointment.appointmentDate || "N/A"}*`);
  lines.push(`🕒 Time : *${appointment.timeSlot || "N/A"}*`);
  lines.push(`📝 Reason : *${appointment.reason || "N/A"}*`);
  lines.push(`💰 Consultation Fee : *${appointment.fees ? `₹${appointment.fees}` : "N/A"}*`);

  lines.push("");
  lines.push("📍 *Please arrive 15 minutes before your appointment.*");
  lines.push("🪪 Kindly carry your previous medical records (if any).");

  if (isReminder) {
    lines.push("");
    lines.push("❗ If you are unable to attend, please inform us in advance.");
  }

  lines.push("");
  lines.push("🙏 Thank you for choosing *Annandi Hospital*.");
  if (contactValue) {
    lines.push(`📞 Hospital Contact: ${contactValue}`);
  } else {
    lines.push("📞 Contact: +91-XXXXXXXXXX");
  }

  return lines.join("\n");
};