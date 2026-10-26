/** Owner: fill with a public support address once one has been established. */
export const CONTACT_EMAIL = "";
export const OPERATOR_URL = "https://amammustofa.com";
export const ISSUES_URL = "https://github.com/cakasuma/online-calculators/issues";

export interface LegalSection {
  heading: string;
  body: string;
}

export const privacySections: LegalSection[] = [
  {
    heading: "1. Overview",
    body: "HelloKalku is a free online calculator and financial-planning guide for users in Malaysia and Southeast Asia. This Privacy Policy explains what information we collect, what we do not collect, and how we protect your privacy when you use hellokalku.com.",
  },
  {
    heading: "2. Calculator Inputs Stay in Your Browser",
    body: "All calculations — salary, EPF projections, zakat, faraid inheritance, and wasiat planning — are performed entirely in your browser using JavaScript. Your salary figures, asset values, heir details, and any other inputs you enter are never transmitted to our servers. They exist only in your browser's memory while the page is open and are discarded when you close or refresh the page. Saved scenarios and calculation history are stored in your browser's localStorage only on your device.",
  },
  {
    heading: "3. Analytics",
    body: "We use Vercel Analytics to collect anonymous, aggregate statistics about page views and navigation patterns. Vercel Analytics does not use cookies, does not track individual users across sessions, and does not collect personally identifiable information. The data collected includes anonymised page URLs, referrer information, browser type, and country-level location. This data helps us understand which calculators are most used so we can improve them.",
  },
  {
    heading: "4. Advertising (Google AdSense)",
    body: "HelloKalku may display Google AdSense advertisements. Google AdSense may use cookies and similar technologies to serve ads based on your prior visits to this and other websites. Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to our site and/or other sites on the internet. You may opt out of personalised advertising by visiting Google's Ads Settings at adssettings.google.com. If you have not opted out, third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites.",
  },
  {
    heading: "5. Optional Lead Capture Forms",
    body: "Some calculator pages include optional email collection forms (for example, a newsletter sign-up or a request for a free consultation). These forms are clearly labelled and entirely voluntary. If you submit your email address, it is used only for the stated purpose and is never sold to third parties. You can unsubscribe from any email we send using the unsubscribe link in that email.",
  },
  {
    heading: "6. Cookies and Local Storage",
    body: "We use browser localStorage to store: (a) your selected language preference, (b) your dark/light mode preference, (c) calculation history and saved scenarios you have explicitly created. No personally identifiable information is stored in localStorage. We do not set first-party cookies ourselves, though Google AdSense may set third-party advertising cookies as described in Section 4.",
  },
  {
    heading: "7. Children's Privacy",
    body: "HelloKalku is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has submitted personal information to us, please contact us and we will delete it promptly.",
  },
  {
    heading: "8. Your Rights and Choices",
    body: "You can clear all locally stored data (history, preferences) at any time by clearing your browser's site data for hellokalku.com. To opt out of Google personalised advertising, visit adssettings.google.com. If you submitted your email to one of our lead-capture forms and want it removed, contact the site operator using the contact details below.",
  },
  {
    heading: "9. Changes to This Policy",
    body: "We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date. Continued use of HelloKalku after changes constitutes your acceptance of the revised policy.",
  },
  {
    heading: "10. Contact",
    body: "For privacy-related questions or requests, contact the site operator using the contact details below. We aim to respond within 5 business days.",
  },
];

export const termsSections: LegalSection[] = [
  {
    heading: "1. About HelloKalku",
    body: "HelloKalku (hellokalku.com) is a free online calculator platform providing salary, EPF retirement, zakat, faraid inheritance, wasiat planning, and general math calculators for users in Malaysia and Southeast Asia. HelloKalku is operated by an independent developer and is not affiliated with any Malaysian government agency, KWSP/EPF, LHDN, PERKESO, or any Islamic religious authority.",
  },
  {
    heading: "2. Acceptance of Terms",
    body: "By accessing or using HelloKalku you agree to be bound by these Terms of Use and our Privacy Policy. If you do not agree, please do not use this site. We reserve the right to update these terms at any time; continued use after changes are posted constitutes acceptance of the revised terms.",
  },
  {
    heading: "3. Calculator Accuracy and Disclaimer",
    body: "All calculators on HelloKalku provide estimates for informational and educational purposes only. Results are based on statutory rates and guidelines that were current at the time of the last update but may not reflect the most recent changes in legislation, tax regulations, or official rates. Specifically: (a) Salary and PCB estimates do not constitute official payroll advice — your employer's payroll system and LHDN's official e-PCB tool are the authoritative sources. (b) EPF projections are illustrative and depend on dividend rates that are declared annually by KWSP and may differ from the rate used in the calculation. (c) Zakat estimates are for reference only; consult your local zakat authority for official assessment and payment. (d) Faraid and Wasiat content is for educational purposes; consult a qualified Islamic scholar, solicitor, or certified estate planner for legally binding inheritance and will arrangements. You are solely responsible for verifying all results and seeking qualified professional advice before making financial, legal, or religious decisions.",
  },
  {
    heading: "4. No Professional Advice",
    body: "Nothing on HelloKalku constitutes financial advice, legal advice, tax advice, or religious (fatwa) advice. The calculators are tools to help you understand numbers and concepts — not substitutes for professional consultation.",
  },
  {
    heading: "5. Intellectual Property",
    body: "All content, design, code, and materials on HelloKalku are the property of the site operator or its licensors and are protected by intellectual property laws. You may use HelloKalku for personal, non-commercial purposes. You may not reproduce, redistribute, or sell any part of this site without prior written permission. Third-party tool names, logos, and trademarks mentioned on this site (EPF, KWSP, LHDN, SOCSO, etc.) belong to their respective owners.",
  },
  {
    heading: "6. Third-Party Services",
    body: "HelloKalku uses third-party services including Google AdSense for advertising, Vercel Analytics for anonymous usage statistics, and Vercel for hosting. Your interactions with those services are governed by their respective terms and privacy policies. We are not responsible for the practices of any third-party services.",
  },
  {
    heading: "7. Limitation of Liability",
    body: "To the maximum extent permitted by applicable law, HelloKalku and its operator shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of or reliance on this site or its calculators, including but not limited to financial loss, tax penalties, or incorrect estate distribution. Your use of HelloKalku is entirely at your own risk.",
  },
  {
    heading: "8. Availability",
    body: "We aim to keep HelloKalku available at all times but do not guarantee uninterrupted access. We may update, modify, or discontinue any tool or feature at any time without notice.",
  },
  {
    heading: "9. Governing Law",
    body: "These Terms of Use are governed by the laws of Malaysia. Any disputes arising from your use of this site shall be subject to the exclusive jurisdiction of the courts of Malaysia.",
  },
  {
    heading: "10. Contact",
    body: "For questions about these Terms, contact the site operator using the contact details below. We aim to respond within 5 business days.",
  },
];

export const companyPages = {
  about: {
    en: {
      title: "About HelloKalku",
      paragraphs: [
        "HelloKalku helps people in Malaysia answer one question: what is my real take-home pay, and what should I do about it? The core journey runs from the salary calculator (EPF, SOCSO, EIS, the SKBBK Lindung 24 Jam deduction and monthly tax deduction) to the income tax calculator and then the EPF retirement projection. Housing loan, car loan, fixed deposit and Islamic finance tools (zakat, faraid, wasiat) sit alongside it.",
        "Who built it: HelloKalku is built and maintained by Mustofa Amami, a tech lead and instructor, who runs the site as an independent project (amammustofa.com). HelloKalku is not affiliated with KWSP/EPF, PERKESO, LHDN or any religious authority, and nothing here is professional tax, financial or religious advice.",
        "Methodology: the salary calculator uses the PERKESO contribution band table (RM100 wage bands with the RM6,000 wage ceiling), 11% employee EPF with the 13% or 12% employer rate, the 0.2% EIS rate on each side, and the 0.75% employee SKBBK deduction capped at RM45 a month from 1 June 2026. Tax uses the resident progressive rates, standard reliefs and rebates for the assessment year shown on the page. Foreign worker mode applies the 2% employee and 2% employer EPF rate and removes employee SOCSO and EIS.",
        "Data sources and verification: rates are checked against the official KWSP, PERKESO and LHDN websites, and each salary, EPF and income tax page shows the date they were last verified with links to those sources. Automated tests compare the salary engine against the PERKESO band table at several salaries. Statutory rates change, so please confirm important figures with the official source or your payroll department.",
        "Islamic finance tools: the zakat, faraid and wasiat calculators give general estimates based on commonly used methods. Reviewed by: [pending]. A qualified religious reviewer has not yet been named, and rulings can differ by state and school of thought, so consult your state zakat office, a Syariah court or a qualified scholar before acting on a result.",
        "Reporting an error: if a number looks wrong, open an issue at github.com/cakasuma/online-calculators/issues with the page address, the values you entered and the result you expected. Corrections to rates are published as soon as they are confirmed. See the Contact page for details.",
        "Privacy: calculator inputs are processed in your browser and are not sent to our servers. Saved scenarios and history stay in local browser storage. See the Privacy Policy for analytics and advertising details, and the Terms of Use for the limits of these estimates. The site is available in English, Bahasa Malaysia and Bahasa Indonesia.",
      ],
    },
    ms: {
      title: "Tentang HelloKalku",
      paragraphs: [
        "HelloKalku membantu rakyat Malaysia menjawab satu soalan: berapakah gaji bersih sebenar saya dan apa yang perlu dilakukan? Perjalanan utamanya bermula dengan kalkulator gaji (EPF, SOCSO, SIP, potongan SKBBK Lindung 24 Jam dan potongan cukai bulanan), kemudian kalkulator cukai pendapatan dan unjuran persaraan EPF. Alat pinjaman rumah, pinjaman kereta, simpanan tetap dan kewangan Islam (zakat, faraid, wasiat) turut disediakan.",
        "Siapa yang membinanya: HelloKalku dibina dan diselenggara oleh Mustofa Amami, ketua teknologi dan pengajar, sebagai projek bebas (amammustofa.com). HelloKalku tidak berafiliasi dengan KWSP/EPF, PERKESO, LHDN atau mana-mana pihak berkuasa agama, dan tiada apa di sini merupakan nasihat cukai, kewangan atau agama profesional.",
        "Metodologi: kalkulator gaji menggunakan jadual caruman berperingkat PERKESO (jalur gaji RM100 dengan siling gaji RM6,000), EPF pekerja 11% dengan kadar majikan 13% atau 12%, kadar SIP 0.2% bagi setiap pihak, dan potongan SKBBK pekerja 0.75% dengan had RM45 sebulan mulai 1 Jun 2026. Cukai menggunakan kadar progresif pemastautin, pelepasan dan rebat standard bagi tahun taksiran yang dipaparkan. Mod pekerja asing menggunakan kadar EPF 2% pekerja dan 2% majikan serta tiada SOCSO dan SIP pekerja.",
        "Sumber data dan semakan: kadar disemak dengan laman rasmi KWSP, PERKESO dan LHDN, dan setiap halaman gaji, EPF dan cukai pendapatan memaparkan tarikh semakan terakhir beserta pautan sumber. Ujian automatik membandingkan enjin gaji dengan jadual jalur PERKESO pada beberapa gaji. Kadar berkanun boleh berubah, jadi sahkan angka penting dengan sumber rasmi atau bahagian gaji majikan anda.",
        "Alat kewangan Islam: kalkulator zakat, faraid dan wasiat memberi anggaran umum berdasarkan kaedah lazim. Reviewed by: [pending]. Penyemak agama yang bertauliah belum dinamakan dan hukum boleh berbeza mengikut negeri dan mazhab, jadi rujuk pusat zakat negeri, mahkamah syariah atau ulama bertauliah sebelum bertindak.",
        "Melaporkan kesilapan: jika sesuatu angka kelihatan salah, buka isu di github.com/cakasuma/online-calculators/issues dengan alamat halaman, nilai yang dimasukkan dan hasil yang dijangka. Pembetulan kadar diterbitkan sebaik sahaja disahkan. Lihat halaman Hubungi untuk butiran.",
        "Privasi: input kalkulator diproses dalam pelayar anda dan tidak dihantar ke pelayan kami. Senario tersimpan dan sejarah kekal dalam storan pelayar. Lihat Dasar Privasi untuk analitik dan pengiklanan, dan Syarat Penggunaan untuk had anggaran ini. Laman ini tersedia dalam bahasa Inggeris, Bahasa Malaysia dan Bahasa Indonesia.",
      ],
    },
    id: {
      title: "Tentang HelloKalku",
      paragraphs: [
        "HelloKalku membantu orang di Malaysia menjawab satu pertanyaan: berapa gaji bersih saya sebenarnya dan apa yang perlu dilakukan? Alur utamanya dimulai dari kalkulator gaji (EPF, SOCSO, EIS, potongan SKBBK Lindung 24 Jam, dan potongan pajak bulanan), lalu kalkulator pajak penghasilan dan proyeksi pensiun EPF. Alat KPR, kredit mobil, deposito, dan keuangan Islam (zakat, faraid, wasiat) tersedia di sampingnya.",
        "Siapa pembuatnya: HelloKalku dibangun dan dikelola oleh Mustofa Amami, tech lead dan instruktur, sebagai proyek independen (amammustofa.com). HelloKalku tidak berafiliasi dengan KWSP/EPF, PERKESO, LHDN, atau otoritas agama mana pun, dan tidak ada yang di sini merupakan nasihat pajak, keuangan, atau agama profesional.",
        "Metodologi: kalkulator gaji memakai tabel iuran berjenjang PERKESO (rentang upah RM100 dengan batas upah RM6,000), EPF karyawan 11% dengan tarif pemberi kerja 13% atau 12%, tarif EIS 0,2% untuk masing-masing pihak, dan potongan SKBBK karyawan 0,75% dengan batas RM45 per bulan mulai 1 Juni 2026. Pajak memakai tarif progresif untuk resident, pengurang dan rebat standar sesuai tahun pajak yang tampil. Mode pekerja asing memakai EPF 2% karyawan dan 2% pemberi kerja, serta tanpa SOCSO dan EIS karyawan.",
        "Sumber data dan verifikasi: tarif dicek terhadap situs resmi KWSP, PERKESO, dan LHDN, dan setiap halaman gaji, EPF, dan pajak penghasilan menampilkan tanggal verifikasi terakhir beserta tautan sumbernya. Tes otomatis membandingkan mesin gaji dengan tabel rentang PERKESO pada beberapa gaji. Tarif resmi bisa berubah, jadi konfirmasikan angka penting dengan sumber resmi atau bagian payroll Anda.",
        "Alat keuangan Islam: kalkulator zakat, faraid, dan wasiat memberi perkiraan umum berdasarkan metode yang lazim. Reviewed by: [pending]. Peninjau agama yang berkualifikasi belum ditunjuk dan ketentuan bisa berbeda antarnegara bagian dan mazhab, jadi konsultasikan dengan pusat zakat negeri, mahkamah syariah, atau ulama sebelum bertindak.",
        "Melaporkan kesalahan: jika ada angka yang tampak keliru, buka isu di github.com/cakasuma/online-calculators/issues dengan alamat halaman, nilai yang Anda masukkan, dan hasil yang Anda harapkan. Koreksi tarif dipublikasikan segera setelah terkonfirmasi. Lihat halaman Kontak untuk detail.",
        "Privasi: input kalkulator diproses di browser Anda dan tidak dikirim ke server kami. Skenario tersimpan dan riwayat tetap di penyimpanan browser. Lihat Kebijakan Privasi untuk analitik dan iklan, serta Ketentuan Penggunaan untuk batas perkiraan ini. Situs tersedia dalam bahasa Inggris, Bahasa Malaysia, dan Bahasa Indonesia.",
      ],
    },
  },
  contact: {
    en: {
      title: "Contact HelloKalku",
      paragraphs: [
        "The fastest way to reach us, and the best way to report a wrong figure, is to open an issue at github.com/cakasuma/online-calculators/issues. You can also reach the site operator, Mustofa Amami, through amammustofa.com.",
        "When reporting a calculator error, include the calculator name, the page address, the values needed to reproduce the issue if they are not sensitive, the result you saw and the result you expected, ideally with the official source (KWSP, PERKESO or LHDN) that shows the correct rate.",
        "Please do not send passwords, bank details, identity numbers, payslips or other sensitive personal information, and never post them in a public issue. Calculator inputs are not needed to report a problem.",
        "For privacy requests, say which message or form you mean and what you would like us to do. For questions about your own contributions, tax assessment or a religious ruling, please contact KWSP, PERKESO, LHDN, your state zakat office or a qualified professional, because we cannot give personal advice.",
        "Corrections to published rates are made as soon as they are confirmed against the official source, and each salary, EPF and tax page shows the date its rates were last verified. Messages are reviewed by the independent operator, so a reply may take several business days. See the About page for our methodology and data sources.",
      ],
    },
    ms: {
      title: "Hubungi HelloKalku",
      paragraphs: [
        "Cara terpantas untuk menghubungi kami, dan cara terbaik melaporkan angka yang salah, ialah membuka isu di github.com/cakasuma/online-calculators/issues. Anda juga boleh menghubungi pengendali laman, Mustofa Amami, melalui amammustofa.com.",
        "Apabila melaporkan kesilapan kalkulator, sertakan nama kalkulator, alamat halaman, nilai yang diperlukan untuk mengulang isu jika tidak sensitif, hasil yang anda lihat dan hasil yang dijangka, sebaik-baiknya dengan sumber rasmi (KWSP, PERKESO atau LHDN) yang menunjukkan kadar yang betul.",
        "Jangan hantar kata laluan, butiran bank, nombor pengenalan, slip gaji atau maklumat peribadi sensitif lain, dan jangan sekali-kali menyiarkannya dalam isu awam. Input kalkulator tidak diperlukan untuk melaporkan masalah.",
        "Untuk permintaan privasi, nyatakan mesej atau borang yang dimaksudkan dan tindakan yang anda mahu. Bagi soalan tentang caruman, taksiran cukai atau hukum agama anda sendiri, sila hubungi KWSP, PERKESO, LHDN, pusat zakat negeri atau profesional bertauliah kerana kami tidak dapat memberi nasihat peribadi.",
        "Pembetulan kadar diterbitkan sebaik sahaja disahkan dengan sumber rasmi, dan setiap halaman gaji, EPF dan cukai memaparkan tarikh kadar disemak. Mesej disemak oleh pengendali bebas, jadi balasan mungkin mengambil masa beberapa hari bekerja. Lihat halaman Tentang untuk metodologi dan sumber data kami.",
      ],
    },
    id: {
      title: "Hubungi HelloKalku",
      paragraphs: [
        "Cara tercepat menghubungi kami, dan cara terbaik melaporkan angka yang salah, adalah membuka isu di github.com/cakasuma/online-calculators/issues. Anda juga dapat menghubungi pengelola situs, Mustofa Amami, melalui amammustofa.com.",
        "Saat melaporkan kesalahan kalkulator, sertakan nama kalkulator, alamat halaman, nilai yang diperlukan untuk mengulang masalah jika tidak sensitif, hasil yang Anda lihat dan yang Anda harapkan, sebaiknya dengan sumber resmi (KWSP, PERKESO, atau LHDN) yang menunjukkan tarif yang benar.",
        "Jangan kirim kata sandi, detail bank, nomor identitas, slip gaji, atau informasi pribadi sensitif lainnya, dan jangan pernah memostingnya di isu publik. Input kalkulator tidak diperlukan untuk melaporkan masalah.",
        "Untuk permintaan privasi, sebutkan pesan atau formulir yang dimaksud dan tindakan yang Anda minta. Untuk pertanyaan tentang iuran, penilaian pajak, atau ketentuan agama Anda sendiri, hubungi KWSP, PERKESO, LHDN, pusat zakat negeri, atau profesional berkualifikasi karena kami tidak dapat memberi nasihat pribadi.",
        "Koreksi tarif dipublikasikan segera setelah terkonfirmasi dengan sumber resmi, dan setiap halaman gaji, EPF, dan pajak menampilkan tanggal tarif terakhir diverifikasi. Pesan ditinjau oleh pengelola independen, jadi balasan mungkin memerlukan beberapa hari kerja. Lihat halaman Tentang untuk metodologi dan sumber data kami.",
      ],
    },
  },
} as const;
