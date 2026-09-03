const publicLeadForm = document.querySelector("#publicLeadForm");
const publicStatus = document.querySelector("#publicStatus");
const publicSubmit = publicLeadForm?.querySelector('button[type="submit"]');
const params = new URLSearchParams(window.location.search);
const publicDealIntent = document.querySelector("#publicDealIntent");
const publicBudgetPeriod = document.querySelector("#publicBudgetPeriod");
const publicBudget = document.querySelector("#publicBudget");
const publicContractTerm = document.querySelector("#publicContractTerm");
const publicCustomerCountry = document.querySelector("#publicCustomerCountry");
const publicLanguage = document.querySelector("#publicLanguage");

const translations = {
  en: {
    navLanguages: "7 languages",
    navAgent: "Asia agent desk",
    navSeo: "SEO + API",
    heroLabel: "International real estate agent · Thailand",
    heroTitle: "Seven-language Thailand property desk for rentals, buyers and agent referrals",
    heroIntro:
      "Lilith Homes captures rental, buyer, owner-listing and partner-referral briefs, then gives the team the details needed to shortlist homes, call back and book viewings.",
    heroSubcopy: "Built for English, Vietnamese, Thai, Korean, Japanese, Chinese and Russian clients.",
    statService: "Rent · Buy · List · Refer",
    statLanguages: "EN · VI · TH · KO · JA · ZH · RU",
    statApi: "CSV / JSON import API",
    focusTitle: "Prime Bangkok and Thailand property desk",
    focusBody:
      "Bangkok CBD · Riverside · Sukhumvit · Sathorn · Pattaya · Phuket · expat relocation · overseas agency referral",
    formLabel: "Qualified property brief",
    formTitle: "Send your property brief",
    formIntro: "This information helps Lilith Homes shortlist properties and contact you back.",
    dealIntentLabel: "Request type",
    intentRent: "Rent 12-month",
    intentBuy: "Buy condo",
    intentSell: "Sell/List property",
    intentReferral: "Agent referral",
    countryLabel: "Customer country",
    nameLabel: "Customer / Agent name",
    namePlaceholder: "e.g. Ms. Li / Mr. Nguyen / Agent Ivan",
    contactLabel: "Phone / Email / LINE",
    contactPlaceholder: "Best contact channel for reply",
    wechatLabel: "WeChat / Kakao / Zalo",
    wechatPlaceholder: "Messaging ID if available",
    languageLabel: "Preferred language",
    budgetPeriodLabel: "Budget type",
    budgetMonthly: "Monthly rent",
    budgetPurchase: "Purchase budget",
    budgetListing: "Listing value",
    budgetLabel: "Budget THB",
    areaLabel: "Preferred area",
    areaPlaceholder: "e.g. Phrom Phong, Sathorn, Pattaya, Phuket",
    propertyTypeLabel: "Property type",
    bedroomsLabel: "Bedrooms",
    moveDateLabel: "Move-in / available date",
    viewingLabel: "Viewing window",
    viewingTodayEvening: "This evening",
    viewingTomorrowMorning: "Tomorrow morning",
    viewingTomorrowEvening: "Tomorrow evening",
    viewingWeekday: "Weekday",
    viewingWeekend: "Weekend",
    viewingVideo: "Video viewing first",
    contractLabel: "Contract term",
    partnerAgencyLabel: "Partner company",
    partnerAgencyPlaceholder: "e.g. Seoul relocation desk",
    partnerAgentLabel: "Partner agent name",
    partnerAgentPlaceholder: "Name of referring agent",
    partnerContactLabel: "Partner contact",
    partnerContactPlaceholder: "WeChat / Kakao / Zalo / Email / Phone",
    requirementsLabel: "Key requirements",
    requirementsPlaceholder:
      "e.g. near BTS, foreign quota, pet-friendly, school, invoice support, preferred projects",
    consentText: "I confirm Lilith Homes may contact me or my client about this property request.",
    submitButton: "Send brief to Lilith",
    statusReady:
      "Supports English, Vietnamese, Thai, Korean, Japanese, Chinese and Russian clients · Public form keeps lead details private",
    statusSending: "Sending your property brief to Lilith Homes...",
    statusSuccess:
      "Brief sent. Lilith Homes will contact you to confirm the details and arrange the next step.",
    statusBudgetError:
      "Please check the rental budget of THB 30,000-250,000 or choose the correct purchase/listing budget type.",
    statusError: "Submission failed. Please check name, contact, budget, area and consent, then try again.",
    submittingButton: "Sending...",
    workflowCaptureTitle: "01 · Capture",
    workflowCaptureBody: "Receive leads from the public form, partner agents, CSV or JSON API",
    workflowQualifyTitle: "02 · Qualify",
    workflowQualifyBody: "Check budget, area, property type, language, country and contact channel",
    workflowMatchTitle: "03 · Match",
    workflowMatchBody: "Prioritize property shortlists and follow-up tasks for the team",
    workflowCloseTitle: "04 · Close",
    workflowCloseBody: "Send shortlist, book viewings, prepare offers and coordinate referrals",
    seoLabel: "On-page SEO",
    seoTitle: "Ready for seven-language search intent",
    seoBody:
      "Includes title, description, keyword intent, heading hierarchy, language content, internal anchors, Open Graph and real estate agent structured data.",
    agentLabel: "Asia agent desk",
    agentTitle: "Accept briefs from overseas agents",
    agentBody:
      "Partners can send CSV from Excel or JSON through `/api/import` after an import token is configured. Those leads enter the same dashboard queue.",
    footerText: "International Thailand real estate lead desk · Rent · Buy · List · Refer",
  },
  vi: {
    navLanguages: "7 ngôn ngữ",
    navAgent: "Bàn hỗ trợ châu Á",
    navSeo: "SEO + API",
    heroLabel: "Môi giới bất động sản quốc tế · Thái Lan",
    heroTitle: "Bàn tiếp nhận bất động sản Thái Lan 7 ngôn ngữ cho thuê, mua và giới thiệu khách",
    heroIntro:
      "Lilith Homes tiếp nhận nhu cầu thuê, mua, ký gửi và giới thiệu đối tác, rồi chuyển thông tin cần thiết để đội ngũ chọn căn, gọi lại và đặt lịch xem nhà.",
    heroSubcopy: "Hỗ trợ tiếng Anh, Việt, Thái, Hàn, Nhật, Trung và Nga.",
    statService: "Thuê · Mua · Ký gửi · Giới thiệu",
    statLanguages: "EN · VI · TH · KO · JA · ZH · RU",
    statApi: "Nhập CSV / JSON API",
    focusTitle: "Bàn bất động sản trọng điểm Bangkok và Thái Lan",
    focusBody:
      "Bangkok CBD · Riverside · Sukhumvit · Sathorn · Pattaya · Phuket · chuyển nhà cho expat · giới thiệu từ đại lý nước ngoài",
    formLabel: "Thông tin nhu cầu đã sàng lọc",
    formTitle: "Gửi nhu cầu bất động sản",
    formIntro: "Thông tin này giúp Lilith Homes chọn bất động sản phù hợp và liên hệ lại.",
    dealIntentLabel: "Loại nhu cầu",
    intentRent: "Thuê 12 tháng",
    intentBuy: "Mua condo",
    intentSell: "Bán/Ký gửi",
    intentReferral: "Giới thiệu từ đại lý",
    countryLabel: "Quốc gia của khách",
    nameLabel: "Tên khách / đại lý",
    namePlaceholder: "VD: Ms. Li / Anh Nguyen / Agent Ivan",
    contactLabel: "Điện thoại / Email / LINE",
    contactPlaceholder: "Kênh liên hệ tốt nhất",
    wechatLabel: "WeChat / Kakao / Zalo",
    wechatPlaceholder: "ID nhắn tin nếu có",
    languageLabel: "Ngôn ngữ ưu tiên",
    budgetPeriodLabel: "Loại ngân sách",
    budgetMonthly: "Tiền thuê hàng tháng",
    budgetPurchase: "Ngân sách mua",
    budgetListing: "Giá trị ký gửi",
    budgetLabel: "Ngân sách THB",
    areaLabel: "Khu vực mong muốn",
    areaPlaceholder: "VD: Phrom Phong, Sathorn, Pattaya, Phuket",
    propertyTypeLabel: "Loại bất động sản",
    bedroomsLabel: "Phòng ngủ",
    moveDateLabel: "Ngày vào ở / có thể bán",
    viewingLabel: "Thời gian xem nhà",
    viewingTodayEvening: "Tối nay",
    viewingTomorrowMorning: "Sáng mai",
    viewingTomorrowEvening: "Tối mai",
    viewingWeekday: "Ngày thường",
    viewingWeekend: "Cuối tuần",
    viewingVideo: "Xem video trước",
    contractLabel: "Thời hạn hợp đồng",
    partnerAgencyLabel: "Công ty đối tác",
    partnerAgencyPlaceholder: "VD: Vietnam relocation desk",
    partnerAgentLabel: "Tên đại lý đối tác",
    partnerAgentPlaceholder: "Tên người giới thiệu lead",
    partnerContactLabel: "Liên hệ đối tác",
    partnerContactPlaceholder: "WeChat / Kakao / Zalo / Email / Phone",
    requirementsLabel: "Yêu cầu quan trọng",
    requirementsPlaceholder: "VD: gần BTS, quota nước ngoài, cho thú cưng, trường học, hóa đơn, dự án yêu thích",
    consentText: "Tôi xác nhận Lilith Homes có thể liên hệ tôi hoặc khách của tôi về nhu cầu này.",
    submitButton: "Gửi brief cho Lilith",
    statusReady: "Hỗ trợ tiếng Anh, Việt, Thái, Hàn, Nhật, Trung và Nga · Thông tin lead được giữ riêng tư",
    statusSending: "Đang gửi nhu cầu cho Lilith Homes...",
    statusSuccess: "Đã gửi brief. Lilith Homes sẽ liên hệ để xác nhận và sắp xếp bước tiếp theo.",
    statusBudgetError: "Vui lòng kiểm tra ngân sách thuê THB 30,000-250,000 hoặc chọn đúng loại ngân sách mua/bán.",
    statusError: "Gửi không thành công. Vui lòng kiểm tra tên, liên hệ, ngân sách, khu vực và xác nhận đồng ý.",
    submittingButton: "Đang gửi...",
    workflowCaptureTitle: "01 · Tiếp nhận",
    workflowCaptureBody: "Nhận lead từ form công khai, đại lý đối tác, CSV hoặc JSON API",
    workflowQualifyTitle: "02 · Sàng lọc",
    workflowQualifyBody: "Kiểm tra ngân sách, khu vực, loại nhà, ngôn ngữ, quốc gia và kênh liên hệ",
    workflowMatchTitle: "03 · Ghép căn",
    workflowMatchBody: "Ưu tiên danh sách căn phù hợp và việc cần theo dõi cho đội ngũ",
    workflowCloseTitle: "04 · Chốt việc",
    workflowCloseBody: "Gửi shortlist, đặt lịch xem nhà, chuẩn bị offer và phối hợp referral",
    seoLabel: "SEO trên trang",
    seoTitle: "Sẵn sàng cho intent tìm kiếm 7 ngôn ngữ",
    seoBody: "Có title, description, intent từ khóa, cấu trúc heading, nội dung đa ngôn ngữ, anchor nội bộ, Open Graph và structured data.",
    agentLabel: "Bàn đại lý châu Á",
    agentTitle: "Nhận brief từ đại lý nước ngoài",
    agentBody: "Đối tác có thể gửi CSV từ Excel hoặc JSON qua `/api/import` sau khi cấu hình import token. Lead vào cùng hàng đợi dashboard.",
    footerText: "Bàn lead bất động sản quốc tế Thái Lan · Thuê · Mua · Ký gửi · Giới thiệu",
  },
  th: {
    navLanguages: "7 ภาษา",
    navAgent: "โต๊ะเอเจนต์เอเชีย",
    navSeo: "SEO + API",
    heroLabel: "เอเจนต์อสังหาริมทรัพย์ต่างชาติ · ประเทศไทย",
    heroTitle: "เว็บรับโจทย์อสังหาไทย 7 ภาษา สำหรับเช่า ซื้อ และ referral จากเอเจนต์",
    heroIntro:
      "Lilith Homes รับโจทย์เช่า ซื้อ ขาย และ referral จากพาร์ตเนอร์ แล้วจัดข้อมูลสำคัญให้ทีมคัดทรัพย์ ติดต่อกลับ และปิดนัดชมได้เร็วขึ้น",
    heroSubcopy: "รองรับอังกฤษ เวียดนาม ไทย เกาหลี ญี่ปุ่น จีน และรัสเซีย",
    statService: "เช่า · ซื้อ · ฝากขาย · ส่งต่อ",
    statLanguages: "EN · VI · TH · KO · JA · ZH · RU",
    statApi: "นำเข้า CSV / JSON API",
    focusTitle: "โต๊ะอสังหาโซนหลักกรุงเทพฯ และประเทศไทย",
    focusBody:
      "Bangkok CBD · Riverside · Sukhumvit · Sathorn · Pattaya · Phuket · expat relocation · referral จากเอเจนต์ต่างประเทศ",
    formLabel: "Qualified property brief",
    formTitle: "ส่งโจทย์อสังหาให้ทีม",
    formIntro: "ข้อมูลนี้ใช้คัดทรัพย์และติดต่อกลับผ่านทีม Lilith Homes",
    dealIntentLabel: "ประเภทโจทย์",
    intentRent: "เช่า 12 เดือน",
    intentBuy: "ซื้อคอนโด",
    intentSell: "ขาย/ฝากทรัพย์",
    intentReferral: "Agent referral",
    countryLabel: "ประเทศลูกค้า",
    nameLabel: "ชื่อลูกค้า / Agent",
    namePlaceholder: "เช่น Ms. Li / คุณ Nguyen / Agent Ivan",
    contactLabel: "โทร / Email / LINE",
    contactPlaceholder: "ข้อมูลติดต่อที่ตอบกลับได้",
    wechatLabel: "WeChat / Kakao / Zalo",
    wechatPlaceholder: "Messaging ID ถ้ามี",
    languageLabel: "ภาษาที่สะดวก",
    budgetPeriodLabel: "ประเภทงบ",
    budgetMonthly: "ค่าเช่ารายเดือน",
    budgetPurchase: "งบซื้อ",
    budgetListing: "มูลค่าทรัพย์ฝากขาย",
    budgetLabel: "งบประมาณ THB",
    areaLabel: "ทำเลที่ต้องการ",
    areaPlaceholder: "เช่น Phrom Phong, Sathorn, Pattaya, Phuket",
    propertyTypeLabel: "ประเภททรัพย์",
    bedroomsLabel: "ห้องนอน",
    moveDateLabel: "วันเข้าอยู่ / วันพร้อมขาย",
    viewingLabel: "เวลาสะดวกนัดชม",
    viewingTodayEvening: "วันนี้ช่วงเย็น",
    viewingTomorrowMorning: "พรุ่งนี้ช่วงเช้า",
    viewingTomorrowEvening: "พรุ่งนี้ช่วงเย็น",
    viewingWeekday: "วันธรรมดา",
    viewingWeekend: "เสาร์-อาทิตย์",
    viewingVideo: "Video viewing first",
    contractLabel: "ระยะสัญญา",
    partnerAgencyLabel: "บริษัทพาร์ตเนอร์",
    partnerAgencyPlaceholder: "เช่น Seoul relocation desk",
    partnerAgentLabel: "ชื่อเอเจนต์พาร์ตเนอร์",
    partnerAgentPlaceholder: "ชื่อผู้ส่ง lead",
    partnerContactLabel: "ติดต่อพาร์ตเนอร์",
    partnerContactPlaceholder: "WeChat / Kakao / Zalo / Email / Phone",
    requirementsLabel: "เงื่อนไขสำคัญ",
    requirementsPlaceholder: "เช่น near BTS, foreign quota, pet-friendly, school, invoice support, preferred projects",
    consentText: "ยืนยันว่ามีสิทธิ์ส่งข้อมูลนี้ให้ Lilith Homes ติดต่อกลับและประสานงานอสังหา",
    submitButton: "ส่งโจทย์ให้ทีม Lilith",
    statusReady: "รองรับลูกค้าอังกฤษ เวียดนาม ไทย เกาหลี ญี่ปุ่น จีน และรัสเซีย · ฟอร์ม public ไม่เปิดเผยรายชื่อ lead",
    statusSending: "กำลังส่งข้อมูลให้ทีม Lilith เพื่อตรวจโจทย์อสังหา...",
    statusSuccess: "ส่งโจทย์เรียบร้อยแล้ว ทีม Lilith จะติดต่อกลับเพื่อยืนยัน brief และจัดคิวประสานงาน",
    statusBudgetError: "กรุณาตรวจงบเช่า 30,000-250,000 บาท หรือเลือกประเภทงบซื้อ/ขายให้ถูกต้อง",
    statusError: "ส่งไม่สำเร็จ กรุณาลองอีกครั้ง และตรวจชื่อ ช่องทางติดต่อ งบ ทำเล และสิทธิ์ในการส่งข้อมูล",
    submittingButton: "กำลังส่งโจทย์...",
    workflowCaptureTitle: "01 · Capture",
    workflowCaptureBody: "รับ lead จาก public form, agent partner, CSV หรือ JSON API",
    workflowQualifyTitle: "02 · Qualify",
    workflowQualifyBody: "ตรวจงบ ทำเล ประเภททรัพย์ ภาษา ประเทศ และช่องทางติดต่อ",
    workflowMatchTitle: "03 · Match",
    workflowMatchBody: "คัดทรัพย์และจัดลำดับงานให้ทีมตอบกลับหรือนัดชม",
    workflowCloseTitle: "04 · Close",
    workflowCloseBody: "ส่ง shortlist, นัดชม, ทำข้อเสนอ และประสาน partner referral",
    seoLabel: "On-page SEO",
    seoTitle: "พร้อมทำ SEO สำหรับ 7 ภาษา",
    seoBody: "มี title, description, keyword intent, heading hierarchy, language content, internal anchors, Open Graph และ structured data สำหรับ real estate agent",
    agentLabel: "Asia agent desk",
    agentTitle: "รับข้อมูลจากเอเจนต์ต่างประเทศ",
    agentBody: "Partner สามารถส่ง CSV จาก Excel หรือ JSON ผ่าน `/api/import` หลังตั้งค่า import token แล้ว ข้อมูลจะเข้าคิวเดียวกับ dashboard",
    footerText: "Lilith Homes international Thailand real estate lead desk · Rent · Buy · List · Refer",
  },
  ko: {
    navLanguages: "7개 언어",
    navAgent: "아시아 에이전트 데스크",
    navSeo: "SEO + API",
    heroLabel: "국제 부동산 에이전트 · 태국",
    heroTitle: "렌트, 구매, 에이전트 추천을 위한 7개 언어 태국 부동산 데스크",
    heroIntro:
      "Lilith Homes는 렌트, 구매, 매물 등록, 파트너 추천 브리프를 접수하고 팀이 매물을 추리고 연락하며 뷰잉을 예약할 수 있도록 정보를 정리합니다.",
    heroSubcopy: "영어, 베트남어, 태국어, 한국어, 일본어, 중국어, 러시아어 고객을 지원합니다.",
    statService: "렌트 · 구매 · 매물 등록 · 추천",
    statLanguages: "EN · VI · TH · KO · JA · ZH · RU",
    statApi: "CSV / JSON API 가져오기",
    focusTitle: "방콕 및 태국 주요 지역 부동산 데스크",
    focusBody:
      "Bangkok CBD · Riverside · Sukhumvit · Sathorn · Pattaya · Phuket · 주재원 이주 · 해외 에이전트 추천",
    formLabel: "검증된 부동산 브리프",
    formTitle: "부동산 요청 보내기",
    formIntro: "이 정보는 Lilith Homes가 적합한 매물을 추리고 다시 연락하는 데 사용됩니다.",
    dealIntentLabel: "요청 유형",
    intentRent: "12개월 렌트",
    intentBuy: "콘도 구매",
    intentSell: "매도/매물 등록",
    intentReferral: "에이전트 추천",
    countryLabel: "고객 국가",
    nameLabel: "고객 / 에이전트 이름",
    namePlaceholder: "예: Ms. Li / Mr. Kim / Agent Ivan",
    contactLabel: "전화 / Email / LINE",
    contactPlaceholder: "회신 가능한 연락 채널",
    wechatLabel: "WeChat / Kakao / Zalo",
    wechatPlaceholder: "가능한 메시지 ID",
    languageLabel: "선호 언어",
    budgetPeriodLabel: "예산 유형",
    budgetMonthly: "월 렌트",
    budgetPurchase: "구매 예산",
    budgetListing: "매물 가치",
    budgetLabel: "예산 THB",
    areaLabel: "희망 지역",
    areaPlaceholder: "예: Phrom Phong, Sathorn, Pattaya, Phuket",
    propertyTypeLabel: "부동산 유형",
    bedroomsLabel: "침실 수",
    moveDateLabel: "입주 / 가능 날짜",
    viewingLabel: "뷰잉 가능 시간",
    viewingTodayEvening: "오늘 저녁",
    viewingTomorrowMorning: "내일 오전",
    viewingTomorrowEvening: "내일 저녁",
    viewingWeekday: "평일",
    viewingWeekend: "주말",
    viewingVideo: "영상 뷰잉 먼저",
    contractLabel: "계약 기간",
    partnerAgencyLabel: "파트너 회사",
    partnerAgencyPlaceholder: "예: Seoul relocation desk",
    partnerAgentLabel: "파트너 에이전트 이름",
    partnerAgentPlaceholder: "추천 에이전트 이름",
    partnerContactLabel: "파트너 연락처",
    partnerContactPlaceholder: "WeChat / Kakao / Zalo / Email / Phone",
    requirementsLabel: "중요 조건",
    requirementsPlaceholder: "예: BTS 근처, 외국인 쿼터, 반려동물 가능, 학교, 인보이스, 선호 프로젝트",
    consentText: "Lilith Homes가 이 부동산 요청과 관련해 저 또는 제 고객에게 연락해도 됨을 확인합니다.",
    submitButton: "Lilith에 브리프 보내기",
    statusReady: "영어, 베트남어, 태국어, 한국어, 일본어, 중국어, 러시아어 지원 · 리드 정보는 비공개로 유지됩니다",
    statusSending: "Lilith Homes로 요청을 보내는 중...",
    statusSuccess: "브리프가 전송되었습니다. Lilith Homes가 세부 내용을 확인하고 다음 단계를 안내합니다.",
    statusBudgetError: "렌트 예산 THB 30,000-250,000을 확인하거나 구매/매도 예산 유형을 선택해 주세요.",
    statusError: "전송에 실패했습니다. 이름, 연락처, 예산, 지역 및 동의를 확인한 뒤 다시 시도해 주세요.",
    submittingButton: "전송 중...",
    workflowCaptureTitle: "01 · 접수",
    workflowCaptureBody: "공개 폼, 파트너 에이전트, CSV 또는 JSON API에서 리드를 받습니다",
    workflowQualifyTitle: "02 · 검증",
    workflowQualifyBody: "예산, 지역, 유형, 언어, 국가, 연락 채널을 확인합니다",
    workflowMatchTitle: "03 · 매칭",
    workflowMatchBody: "팀을 위해 매물 후보와 후속 작업 우선순위를 정합니다",
    workflowCloseTitle: "04 · 진행",
    workflowCloseBody: "후보 매물 전송, 뷰잉 예약, 오퍼 준비, 추천 건 조율",
    seoLabel: "온페이지 SEO",
    seoTitle: "7개 언어 검색 의도 대응",
    seoBody: "타이틀, 설명, 키워드 의도, heading 구조, 언어 콘텐츠, 내부 앵커, Open Graph 및 부동산 structured data를 포함합니다.",
    agentLabel: "아시아 에이전트 데스크",
    agentTitle: "해외 에이전트 브리프 접수",
    agentBody: "파트너는 import token 설정 후 Excel CSV 또는 JSON을 `/api/import`로 보낼 수 있으며, 리드는 같은 dashboard 큐에 들어갑니다.",
    footerText: "태국 국제 부동산 리드 데스크 · 렌트 · 구매 · 매물 등록 · 추천",
  },
  ja: {
    navLanguages: "7言語",
    navAgent: "アジア代理店デスク",
    navSeo: "SEO + API",
    heroLabel: "国際不動産エージェント · タイ",
    heroTitle: "賃貸、購入、紹介案件に対応する7言語のタイ不動産デスク",
    heroIntro:
      "Lilith Homesは賃貸、購入、売却相談、パートナー紹介の内容を受け取り、物件選定、折り返し連絡、内見予約に必要な情報をチームへ整理します。",
    heroSubcopy: "英語、ベトナム語、タイ語、韓国語、日本語、中国語、ロシア語に対応しています。",
    statService: "賃貸 · 購入 · 売却相談 · 紹介",
    statLanguages: "EN · VI · TH · KO · JA · ZH · RU",
    statApi: "CSV / JSON API取込",
    focusTitle: "バンコク主要エリアとタイ不動産デスク",
    focusBody:
      "Bangkok CBD · Riverside · Sukhumvit · Sathorn · Pattaya · Phuket · 海外赴任 · 海外代理店紹介",
    formLabel: "確認済み不動産ブリーフ",
    formTitle: "不動産リクエストを送信",
    formIntro: "この情報をもとにLilith Homesが物件を選定し、折り返しご連絡します。",
    dealIntentLabel: "リクエスト種別",
    intentRent: "12か月賃貸",
    intentBuy: "コンド購入",
    intentSell: "売却/掲載相談",
    intentReferral: "代理店紹介",
    countryLabel: "顧客の国",
    nameLabel: "顧客 / 代理店名",
    namePlaceholder: "例: Ms. Li / Mr. Sato / Agent Ivan",
    contactLabel: "電話 / Email / LINE",
    contactPlaceholder: "返信可能な連絡先",
    wechatLabel: "WeChat / Kakao / Zalo",
    wechatPlaceholder: "メッセージIDがあれば入力",
    languageLabel: "希望言語",
    budgetPeriodLabel: "予算種別",
    budgetMonthly: "月額賃料",
    budgetPurchase: "購入予算",
    budgetListing: "売却想定額",
    budgetLabel: "予算 THB",
    areaLabel: "希望エリア",
    areaPlaceholder: "例: Phrom Phong, Sathorn, Pattaya, Phuket",
    propertyTypeLabel: "物件タイプ",
    bedroomsLabel: "寝室数",
    moveDateLabel: "入居 / 売却可能日",
    viewingLabel: "内見希望時間",
    viewingTodayEvening: "今夕",
    viewingTomorrowMorning: "明日午前",
    viewingTomorrowEvening: "明日夕方",
    viewingWeekday: "平日",
    viewingWeekend: "週末",
    viewingVideo: "まずビデオ内見",
    contractLabel: "契約期間",
    partnerAgencyLabel: "パートナー会社",
    partnerAgencyPlaceholder: "例: Tokyo relocation desk",
    partnerAgentLabel: "パートナー担当者名",
    partnerAgentPlaceholder: "紹介担当者名",
    partnerContactLabel: "パートナー連絡先",
    partnerContactPlaceholder: "WeChat / Kakao / Zalo / Email / Phone",
    requirementsLabel: "重要条件",
    requirementsPlaceholder: "例: BTS近く、外国人枠、ペット可、学校、請求書、希望プロジェクト",
    consentText: "Lilith Homesがこの不動産リクエストについて私または私の顧客へ連絡することに同意します。",
    submitButton: "Lilithへ送信",
    statusReady: "英語、ベトナム語、タイ語、韓国語、日本語、中国語、ロシア語対応 · リード情報は非公開です",
    statusSending: "Lilith Homesへ送信中...",
    statusSuccess: "送信されました。Lilith Homesが内容を確認し、次のステップをご連絡します。",
    statusBudgetError: "賃貸予算THB 30,000-250,000を確認するか、購入/売却の予算種別を選択してください。",
    statusError: "送信できませんでした。名前、連絡先、予算、エリア、同意を確認して再度お試しください。",
    submittingButton: "送信中...",
    workflowCaptureTitle: "01 · 受付",
    workflowCaptureBody: "公開フォーム、代理店、CSV、JSON APIからリードを受け取ります",
    workflowQualifyTitle: "02 · 確認",
    workflowQualifyBody: "予算、エリア、物件タイプ、言語、国、連絡方法を確認します",
    workflowMatchTitle: "03 · 選定",
    workflowMatchBody: "物件候補とチームのフォローアップを優先順位付けします",
    workflowCloseTitle: "04 · 成約支援",
    workflowCloseBody: "候補物件送付、内見予約、オファー準備、紹介案件調整",
    seoLabel: "オンページSEO",
    seoTitle: "7言語の検索意図に対応",
    seoBody: "title、description、キーワード意図、heading構造、多言語コンテンツ、内部アンカー、Open Graph、不動産structured dataを含みます。",
    agentLabel: "アジア代理店デスク",
    agentTitle: "海外代理店からのブリーフを受付",
    agentBody: "パートナーはimport token設定後、Excel CSVまたはJSONを`/api/import`へ送信できます。リードは同じdashboardキューに入ります。",
    footerText: "タイ国際不動産リードデスク · 賃貸 · 購入 · 売却相談 · 紹介",
  },
  zh: {
    navLanguages: "7种语言",
    navAgent: "亚洲代理服务台",
    navSeo: "SEO + API",
    heroLabel: "国际房地产经纪 · 泰国",
    heroTitle: "面向租赁、购房与代理转介的7语言泰国房产服务台",
    heroIntro:
      "Lilith Homes接收租赁、购房、业主委托和合作伙伴转介需求，并整理团队筛选房源、回访和预约看房所需信息。",
    heroSubcopy: "支持英语、越南语、泰语、韩语、日语、中文和俄语客户。",
    statService: "租赁 · 购买 · 委托 · 转介",
    statLanguages: "EN · VI · TH · KO · JA · ZH · RU",
    statApi: "CSV / JSON API导入",
    focusTitle: "曼谷核心区与泰国房产服务台",
    focusBody: "Bangkok CBD · Riverside · Sukhumvit · Sathorn · Pattaya · Phuket · 外籍搬迁 · 海外代理转介",
    formLabel: "合格房产需求",
    formTitle: "提交房产需求",
    formIntro: "这些信息帮助Lilith Homes筛选房源并联系您。",
    dealIntentLabel: "需求类型",
    intentRent: "租赁12个月",
    intentBuy: "购买公寓",
    intentSell: "出售/委托房源",
    intentReferral: "代理转介",
    countryLabel: "客户国家",
    nameLabel: "客户 / 代理姓名",
    namePlaceholder: "例如 Ms. Li / Mr. Wang / Agent Ivan",
    contactLabel: "电话 / Email / LINE",
    contactPlaceholder: "可回复的最佳联系方式",
    wechatLabel: "WeChat / Kakao / Zalo",
    wechatPlaceholder: "如有，请填写通讯ID",
    languageLabel: "首选语言",
    budgetPeriodLabel: "预算类型",
    budgetMonthly: "月租预算",
    budgetPurchase: "购房预算",
    budgetListing: "委托估值",
    budgetLabel: "预算 THB",
    areaLabel: "目标区域",
    areaPlaceholder: "例如 Phrom Phong, Sathorn, Pattaya, Phuket",
    propertyTypeLabel: "房产类型",
    bedroomsLabel: "卧室",
    moveDateLabel: "入住 / 可售日期",
    viewingLabel: "看房时间",
    viewingTodayEvening: "今天傍晚",
    viewingTomorrowMorning: "明天上午",
    viewingTomorrowEvening: "明天傍晚",
    viewingWeekday: "工作日",
    viewingWeekend: "周末",
    viewingVideo: "先视频看房",
    contractLabel: "合同期限",
    partnerAgencyLabel: "合作公司",
    partnerAgencyPlaceholder: "例如 Shanghai relocation desk",
    partnerAgentLabel: "合作代理姓名",
    partnerAgentPlaceholder: "转介代理姓名",
    partnerContactLabel: "合作伙伴联系方式",
    partnerContactPlaceholder: "WeChat / Kakao / Zalo / Email / Phone",
    requirementsLabel: "重要条件",
    requirementsPlaceholder: "例如 近BTS、外国人配额、可养宠、学校、发票、偏好项目",
    consentText: "我确认Lilith Homes可以就此房产需求联系我或我的客户。",
    submitButton: "发送给Lilith",
    statusReady: "支持英语、越南语、泰语、韩语、日语、中文和俄语客户 · 公开表单不会公开lead资料",
    statusSending: "正在发送给Lilith Homes...",
    statusSuccess: "需求已发送。Lilith Homes会联系您确认详情并安排下一步。",
    statusBudgetError: "请检查租赁预算THB 30,000-250,000，或选择正确的购买/出售预算类型。",
    statusError: "提交失败。请检查姓名、联系方式、预算、区域和授权同意后再试。",
    submittingButton: "发送中...",
    workflowCaptureTitle: "01 · 接收",
    workflowCaptureBody: "从公开表单、合作代理、CSV或JSON API接收lead",
    workflowQualifyTitle: "02 · 筛选",
    workflowQualifyBody: "检查预算、区域、房产类型、语言、国家和联系方式",
    workflowMatchTitle: "03 · 匹配",
    workflowMatchBody: "为团队优先整理房源shortlist和跟进任务",
    workflowCloseTitle: "04 · 推进",
    workflowCloseBody: "发送shortlist、预约看房、准备报价并协调转介",
    seoLabel: "页面SEO",
    seoTitle: "支持7语言搜索意图",
    seoBody: "包含title、description、关键词意图、heading结构、多语言内容、内部锚点、Open Graph和房产经纪structured data。",
    agentLabel: "亚洲代理服务台",
    agentTitle: "接收海外代理需求",
    agentBody: "合作伙伴配置import token后，可通过`/api/import`发送Excel CSV或JSON，lead会进入同一个dashboard队列。",
    footerText: "泰国国际房产lead服务台 · 租赁 · 购买 · 委托 · 转介",
  },
  ru: {
    navLanguages: "7 языков",
    navAgent: "Азиатский агентский стол",
    navSeo: "SEO + API",
    heroLabel: "Международный агент по недвижимости · Таиланд",
    heroTitle: "Семиязычный стол недвижимости Таиланда для аренды, покупки и агентских рекомендаций",
    heroIntro:
      "Lilith Homes принимает заявки на аренду, покупку, листинг и партнерские рекомендации, затем передает команде данные для подбора объектов, обратной связи и записи на просмотр.",
    heroSubcopy: "Поддержка клиентов на английском, вьетнамском, тайском, корейском, японском, китайском и русском языках.",
    statService: "Аренда · Покупка · Листинг · Рекомендация",
    statLanguages: "EN · VI · TH · KO · JA · ZH · RU",
    statApi: "Импорт CSV / JSON API",
    focusTitle: "Недвижимость Бангкока и Таиланда",
    focusBody:
      "Bangkok CBD · Riverside · Sukhumvit · Sathorn · Pattaya · Phuket · релокация экспатов · рекомендации зарубежных агентств",
    formLabel: "Проверенная заявка",
    formTitle: "Отправить запрос по недвижимости",
    formIntro: "Эта информация поможет Lilith Homes подобрать объекты и связаться с вами.",
    dealIntentLabel: "Тип запроса",
    intentRent: "Аренда 12 месяцев",
    intentBuy: "Покупка кондо",
    intentSell: "Продажа/листинг",
    intentReferral: "Агентская рекомендация",
    countryLabel: "Страна клиента",
    nameLabel: "Имя клиента / агента",
    namePlaceholder: "Напр. Ms. Li / Mr. Nguyen / Agent Ivan",
    contactLabel: "Телефон / Email / LINE",
    contactPlaceholder: "Лучший канал для ответа",
    wechatLabel: "WeChat / Kakao / Zalo",
    wechatPlaceholder: "ID мессенджера, если есть",
    languageLabel: "Предпочтительный язык",
    budgetPeriodLabel: "Тип бюджета",
    budgetMonthly: "Месячная аренда",
    budgetPurchase: "Бюджет покупки",
    budgetListing: "Стоимость листинга",
    budgetLabel: "Бюджет THB",
    areaLabel: "Желаемый район",
    areaPlaceholder: "Напр. Phrom Phong, Sathorn, Pattaya, Phuket",
    propertyTypeLabel: "Тип недвижимости",
    bedroomsLabel: "Спальни",
    moveDateLabel: "Дата заезда / доступности",
    viewingLabel: "Время просмотра",
    viewingTodayEvening: "Сегодня вечером",
    viewingTomorrowMorning: "Завтра утром",
    viewingTomorrowEvening: "Завтра вечером",
    viewingWeekday: "Будний день",
    viewingWeekend: "Выходные",
    viewingVideo: "Сначала видео-просмотр",
    contractLabel: "Срок договора",
    partnerAgencyLabel: "Партнерская компания",
    partnerAgencyPlaceholder: "Напр. Moscow relocation desk",
    partnerAgentLabel: "Имя партнера-агента",
    partnerAgentPlaceholder: "Имя агента, передавшего lead",
    partnerContactLabel: "Контакт партнера",
    partnerContactPlaceholder: "WeChat / Kakao / Zalo / Email / Phone",
    requirementsLabel: "Ключевые требования",
    requirementsPlaceholder: "Напр. рядом с BTS, foreign quota, pet-friendly, школа, invoice, желаемые проекты",
    consentText: "Я подтверждаю, что Lilith Homes может связаться со мной или моим клиентом по этому запросу.",
    submitButton: "Отправить в Lilith",
    statusReady: "Поддержка английского, вьетнамского, тайского, корейского, японского, китайского и русского · данные lead не публикуются",
    statusSending: "Отправляем запрос в Lilith Homes...",
    statusSuccess: "Заявка отправлена. Lilith Homes свяжется с вами для подтверждения деталей и следующего шага.",
    statusBudgetError: "Проверьте бюджет аренды THB 30,000-250,000 или выберите правильный тип бюджета покупки/продажи.",
    statusError: "Не удалось отправить. Проверьте имя, контакт, бюджет, район и согласие, затем попробуйте снова.",
    submittingButton: "Отправка...",
    workflowCaptureTitle: "01 · Сбор",
    workflowCaptureBody: "Получаем leads из формы, от партнеров, CSV или JSON API",
    workflowQualifyTitle: "02 · Проверка",
    workflowQualifyBody: "Проверяем бюджет, район, тип объекта, язык, страну и канал связи",
    workflowMatchTitle: "03 · Подбор",
    workflowMatchBody: "Приоритизируем shortlist объектов и задачи команды",
    workflowCloseTitle: "04 · Закрытие",
    workflowCloseBody: "Отправляем shortlist, бронируем просмотры, готовим offers и координируем referrals",
    seoLabel: "On-page SEO",
    seoTitle: "Готово для семиязычного поискового спроса",
    seoBody: "Включены title, description, keyword intent, hierarchy, language content, internal anchors, Open Graph и structured data для агента недвижимости.",
    agentLabel: "Азиатский агентский стол",
    agentTitle: "Прием заявок от зарубежных агентов",
    agentBody: "Партнеры могут отправлять CSV из Excel или JSON через `/api/import` после настройки import token. Leads попадают в ту же очередь dashboard.",
    footerText: "Международный lead desk недвижимости Таиланда · Аренда · Покупка · Листинг · Рекомендация",
  },
};

const languageDefaults = {
  en: { country: "United States", language: "English" },
  vi: { country: "Vietnam", language: "Vietnamese" },
  th: { country: "Thailand", language: "Thai" },
  ko: { country: "South Korea", language: "Korean" },
  ja: { country: "Japan", language: "Japanese" },
  zh: { country: "China", language: "Chinese" },
  ru: { country: "Russia", language: "Russian" },
};

let currentLanguage = "en";

function selectedCopy() {
  return translations[currentLanguage] || translations.en;
}

function applyLanguage(language) {
  currentLanguage = translations[language] ? language : "en";
  const copy = selectedCopy();

  document.documentElement.lang = currentLanguage;
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (key && copy[key]) element.textContent = copy[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    if (key && copy[key]) element.setAttribute("placeholder", copy[key]);
  });
  document.querySelectorAll("[data-lang-option]").forEach((button) => {
    const active = button.getAttribute("data-lang-option") === currentLanguage;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (publicStatus?.dataset.statusReady === "true") {
    publicStatus.textContent = copy.statusReady;
  }
  try {
    localStorage.setItem("lilithPublicLanguage", currentLanguage);
  } catch {
    // Language persistence is optional when browser storage is unavailable.
  }
}

function initialLanguage() {
  const queryLanguage = params.get("lang")?.toLowerCase();
  if (queryLanguage && translations[queryLanguage]) return queryLanguage;

  const storedLanguage = localStorage.getItem("lilithPublicLanguage");
  if (storedLanguage && translations[storedLanguage]) return storedLanguage;

  const browserLanguage = navigator.language.toLowerCase();
  if (browserLanguage.startsWith("vi")) return "vi";
  if (browserLanguage.startsWith("th")) return "th";
  if (browserLanguage.startsWith("ko")) return "ko";
  if (browserLanguage.startsWith("ja")) return "ja";
  if (browserLanguage.startsWith("zh")) return "zh";
  if (browserLanguage.startsWith("ru")) return "ru";
  return "en";
}

function setSelectValue(select, value) {
  if (select && Array.from(select.options).some((option) => option.value === value)) {
    select.value = value;
  }
}

function syncLanguageDefaults(language) {
  const defaults = languageDefaults[language] || languageDefaults.en;
  setSelectValue(publicCustomerCountry, defaults.country);
  setSelectValue(publicLanguage, defaults.language);
}

function leadSource() {
  const source = params.get("utm_source") || "public";
  const campaign = params.get("utm_campaign") || "international_property";
  const content = params.get("utm_content");
  return [source, campaign, content, `lang:${currentLanguage}`].filter(Boolean).join(" / ");
}

function syncBudgetMode() {
  const intent = publicDealIntent.value;

  if (intent === "Buy condo") {
    publicBudgetPeriod.value = "Purchase budget";
    publicBudget.min = "1000000";
    publicBudget.max = "250000000";
    publicBudget.step = "100000";
    if (Number(publicBudget.value) < 1000000) publicBudget.value = "8000000";
    publicContractTerm.value = "Not applicable";
    return;
  }

  if (intent === "Sell/List property") {
    publicBudgetPeriod.value = "Listing value";
    publicBudget.min = "1000000";
    publicBudget.max = "500000000";
    publicBudget.step = "100000";
    if (Number(publicBudget.value) < 1000000) publicBudget.value = "12000000";
    publicContractTerm.value = "Not applicable";
    return;
  }

  publicBudgetPeriod.value = "Monthly rent";
  publicBudget.min = "30000";
  publicBudget.max = "250000";
  publicBudget.step = "5000";
  if (Number(publicBudget.value) > 250000 || Number(publicBudget.value) < 30000) {
    publicBudget.value = "120000";
  }
  publicContractTerm.value = "12 months";
}

document.querySelectorAll("[data-lang-option]").forEach((button) => {
  button.addEventListener("click", () => {
    const nextLanguage = button.getAttribute("data-lang-option") || "en";
    applyLanguage(nextLanguage);
    syncLanguageDefaults(nextLanguage);
  });
});

publicDealIntent?.addEventListener("change", syncBudgetMode);

publicLeadForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const copy = selectedCopy();
  publicSubmit.disabled = true;
  publicSubmit.textContent = copy.submittingButton;
  publicStatus.dataset.statusReady = "false";
  publicStatus.textContent = copy.statusSending;

  const lead = {
    name: document.querySelector("#publicName").value.trim(),
    contact: document.querySelector("#publicContact").value.trim(),
    source: leadSource(),
    budget: Number(publicBudget.value),
    budgetPeriod: publicBudgetPeriod.value,
    area: document.querySelector("#publicArea").value.trim(),
    propertyType: document.querySelector("#publicPropertyType").value,
    bedrooms: Number(document.querySelector("#publicBedrooms").value),
    moveDate: document.querySelector("#publicMoveDate").value,
    viewingWindow: document.querySelector("#publicViewingWindow").value,
    contractTerm: publicContractTerm.value,
    preferredLanguage: document.querySelector("#publicLanguage").value,
    customerCountry: document.querySelector("#publicCustomerCountry").value,
    dealIntent: publicDealIntent.value,
    wechat: document.querySelector("#publicWechat").value.trim(),
    partnerAgency: document.querySelector("#publicPartnerAgency").value.trim(),
    partnerAgent: document.querySelector("#publicPartnerAgent").value.trim(),
    partnerContact: document.querySelector("#publicPartnerContact").value.trim(),
    requirements: document.querySelector("#publicRequirements").value.trim(),
    consent: document.querySelector("#publicConsent").checked,
    website: document.querySelector("#publicWebsite").value,
  };

  try {
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(lead),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Lead submission failed");
    }

    publicLeadForm.reset();
    publicDealIntent.value = "Rent 12-month";
    syncLanguageDefaults(currentLanguage);
    document.querySelector("#publicPropertyType").value = "Condo";
    document.querySelector("#publicBedrooms").value = "2";
    syncBudgetMode();
    publicStatus.textContent = copy.statusSuccess;
  } catch (error) {
    publicStatus.textContent =
      error instanceof Error && error.message.includes("Rental leads")
        ? copy.statusBudgetError
        : copy.statusError;
  } finally {
    publicSubmit.disabled = false;
    publicSubmit.textContent = copy.submitButton;
  }
});

applyLanguage(initialLanguage());
syncLanguageDefaults(currentLanguage);
syncBudgetMode();
