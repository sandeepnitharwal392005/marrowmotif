export const supportContact = {
  email: "support@marrowmotif.com",
  phone: "+1 (800) 123-4567",
  hours: "Mon–Fri, 9am–6pm EST",
  contactPath: "/contact",
} as const;

export const supportContactDetails = [
  { icon: "✉️", label: "Email", value: supportContact.email },
  { icon: "📞", label: "Phone", value: supportContact.phone },
  { icon: "🕐", label: "Hours", value: supportContact.hours },
] as const;
