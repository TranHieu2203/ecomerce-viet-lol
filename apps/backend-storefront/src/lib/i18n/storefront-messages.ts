import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from "@lib/util/locales"

/** Chuỗi UI cố định storefront (vi | en). Catalog/CMS vẫn dùng metadata.i18n. */
export type StorefrontMessages = {
  nav: {
    account: string
    cartFallback: string
    collectionsAria: string
    /** FR-24: nhóm gom mục vượt ngưỡng desktop. */
    viewMore: string
  }
  sideMenu: {
    button: string
    closeMenu: string
    languageLabel: string
    languageDefault: string
    home: string
    store: string
    account: string
    cart: string
  }
  footer: {
    tagline: string
    categories: string
    collections: string
    socialHeading: string
    socialFallback: string
    hotlineLabel: string
    emailLabel: string
    customerHeading: string
    linkStore: string
    linkCart: string
    linkAccount: string
  }
  cart: {
    title: string
    emptyTitle: string
    emptyBody: string
    exploreProducts: string
    signInHeading: string
    signInSub: string
    signInCta: string
    summary: string
    goToCheckout: string
    /** Tiêu đề cột tóm tắt bên phải trang checkout */
    inYourCartAside: string
    tableItem: string
    tableQuantity: string
    tablePrice: string
    tableTotal: string
  }
  cartDropdown: {
    title: string
    quantity: string
    remove: string
    subtotalExclTaxes: string
    goToCart: string
    bagEmpty: string
    exploreProducts: string
    exploreSrOnly: string
  }
  totals: {
    subtotalExclShippingTaxes: string
    shipping: string
    discount: string
    taxes: string
    total: string
  }
  checkout: {
    backToCart: string
    backShort: string
    storeFallback: string
    pageTitle: string
    selectPaymentMethod: string
    paymentTestAttention: string
    paymentTestBody: string
    /** Gợi ý sau khi bỏ bước thanh toán online */
    codNotice: string
    addPromotionCodes: string
    applyPromotion: string
    promotionsAppliedHeading: string
    removePromotionSr: string
  }
  order: {
    details: string
    backToOverview: string
    summary: string
    subtotal: string
    shipping: string
    total: string
    discount: string
    taxes: string
  }
  account: {
    account: string
    hello: string
    profile: string
    addresses: string
    orders: string
    overview: string
    logOut: string
    profileMetaDescription: string
    profileIntro: string
    overviewMetaDescription: string
    ordersIntro: string
    ordersMetaDescription: string
    shippingAddressesTitle: string
    addressesIntro: string
    addressesMetaDescription: string
  }
  country: {
    shippingTo: string
  }
  product: {
    continueSetupAdmin: string
    onboardingSuccess: string
    onboardingSub: string
    /** Nút trang chi tiết sản phẩm */
    addToCart: string
    selectVariant: string
    outOfStock: string
    /** Nút mobile khi có nhiều biến thể */
    selectOptions: string
  }
  store: {
    metaTitle: string
    metaDescription: string
    allProducts: string
    sortBy: string
    sortLatest: string
    sortPriceAsc: string
    sortPriceDesc: string
  }
  home: {
    viewAll: string
    hero: string
    heroBanners: string
    heroEmpty: string
    heroPrev: string
    heroNext: string
    heroSlides: string
    heroGoToSlide: string
    ctaFallback: string
    bannerImageAlt: string
    metaFallbackTitle: string
    metaDescription: string
  }
  checkoutSteps: {
    shippingAddress: string
    billingAddress: string
    contact: string
    billingSameAsShipping: string
    continueToDelivery: string
    edit: string
    delivery: string
    shippingMethod: string
    deliveryHowPrompt: string
    pickUpOrder: string
    storePickupTitle: string
    chooseStoreNearYou: string
    continueToPayment: string
    methodSummary: string
    payment: string
    paymentMethod: string
    giftCard: string
    enterCardDetails: string
    continueToReview: string
    paymentDetails: string
    paymentDetailsPending: string
    review: string
    reviewLegal: string
    placeOrder: string
    fullNameLabel: string
    addressLineLabel: string
    phoneLabel: string
    /** Chuỗi chào khi có địa chỉ đã lưu; thay {name} bằng tên */
    savedAddressPrompt: string
    continueToConfirmOrder: string
    deliveryMethodTitle: string
    deliveryMethodSubtitle: string
    postalCodeLabel: string
    cityLabel: string
    provinceLabel: string
    chooseSavedAddress: string
    /** Nút sau khi nhập địa chỉ (luồng không hiện bước giao hàng) */
    continueToPlaceOrder: string
    /** sr-only: vùng xác nhận đặt hàng (không hiện tiêu đề “Xem lại”) */
    confirmPlaceOrderSection: string
  }
  orderCompleted: {
    thankYou: string
    orderPlaced: string
    summaryHeading: string
  }
  support: {
    needHelp: string
    contact: string
    returnsExchanges: string
  }
  auth: {
    welcomeBack: string
    signInBlurb: string
    email: string
    password: string
    emailValidationTitle: string
    signIn: string
    notMember: string
    joinUs: string
    becomeMemberTitle: string
    createProfileBlurb: string
    firstName: string
    lastName: string
    phone: string
    agreePrefix: string
    /** EN: "{store}'s "; VI: "" — đặt trước liên kết Privacy Policy. */
    agreePossessiveStore: string
    privacyPolicy: string
    termsConnector: string
    termsOfUse: string
    join: string
    alreadyMember: string
    signInLink: string
  }
  accountSupport: {
    gotQuestions: string
    customerServiceBlurb: string
    customerService: string
  }
  productTabs: {
    productInformation: string
    shippingReturns: string
    material: string
    countryOfOrigin: string
    type: string
    weight: string
    dimensions: string
    weightGrams: string
    emptyValue: string
    shipFastTitle: string
    shipFastBody: string
    exchangeTitle: string
    exchangeBody: string
    returnsTitle: string
    returnsBody: string
  }
  related: {
    heading: string
    subheading: string
  }
  transfer: {
    requestTitle: string
    intro: string
    acceptExplain: string
    declineExplain: string
    acceptSuccessTitle: string
    acceptSuccessBody: string
    declineSuccessTitle: string
    declineSuccessBody: string
    acceptError: string
    declineError: string
    errorPrefix: string
    transferredToast: string
    declinedToast: string
    acceptButton: string
    declineButton: string
  }
  common: {
    originalPrice: string
  }
  metadata: {
    cartTitle: string
    cartDescription: string
    orderConfirmedTitle: string
    orderConfirmedDescription: string
    /** Placeholder {id} = display_id đơn hàng. */
    orderDetailTitle: string
    orderDetailDescription: string
  }
  pagination: {
    navLabel: string
    goToPage: string
    currentPage: string
    pageStatus: string
  }
}

const vi: StorefrontMessages = {
  nav: {
    account: "Tài khoản",
    cartFallback: "Giỏ hàng",
    collectionsAria: "Menu điều hướng",
    viewMore: "Xem thêm",
  },
  sideMenu: {
    button: "Menu",
    closeMenu: "Đóng menu",
    languageLabel: "Ngôn ngữ",
    languageDefault: "Mặc định",
    home: "Trang chủ",
    store: "Cửa hàng",
    account: "Tài khoản",
    cart: "Giỏ hàng",
  },
  footer: {
    tagline:
      "Sản phẩm chọn lọc, giao hàng thuận tiện. Cảm ơn bạn đã ghé thăm.",
    categories: "Danh mục",
    collections: "Bộ sưu tập",
    socialHeading: "Liên hệ / MXH",
    socialFallback: "Liên hệ",
    hotlineLabel: "Hotline",
    emailLabel: "Email",
    customerHeading: "Khách hàng",
    linkStore: "Cửa hàng",
    linkCart: "Giỏ hàng",
    linkAccount: "Tài khoản",
  },
  cart: {
    title: "Giỏ hàng",
    emptyTitle: "Giỏ hàng",
    emptyBody:
      "Giỏ hàng của bạn đang trống. Dùng liên kết bên dưới để xem sản phẩm.",
    exploreProducts: "Xem sản phẩm",
    signInHeading: "Đã có tài khoản?",
    signInSub: "Đăng nhập để trải nghiệm tốt hơn.",
    signInCta: "Đăng nhập",
    summary: "Tóm tắt",
    goToCheckout: "Đặt hàng",
    inYourCartAside: "Trong giỏ hàng",
    tableItem: "Sản phẩm",
    tableQuantity: "Số lượng",
    tablePrice: "Đơn giá",
    tableTotal: "Thành tiền",
  },
  cartDropdown: {
    title: "Giỏ hàng",
    quantity: "Số lượng:",
    remove: "Xóa",
    subtotalExclTaxes: "Tạm tính (chưa gồm thuế)",
    goToCart: "Vào giỏ hàng",
    bagEmpty: "Giỏ hàng của bạn đang trống.",
    exploreProducts: "Xem sản phẩm",
    exploreSrOnly: "Đến trang tất cả sản phẩm",
  },
  totals: {
    subtotalExclShippingTaxes: "Tạm tính (chưa gồm phí vận chuyển và thuế)",
    shipping: "Vận chuyển",
    discount: "Giảm giá",
    taxes: "Thuế",
    total: "Tổng cộng",
  },
  checkout: {
    backToCart: "Quay lại giỏ hàng",
    backShort: "Quay lại",
    storeFallback: "Cửa hàng",
    pageTitle: "Đặt hàng",
    selectPaymentMethod: "Chọn phương thức thanh toán",
    paymentTestAttention: "Lưu ý:",
    paymentTestBody: "Chỉ phục vụ thử nghiệm.",
    codNotice:
      "Thanh toán khi nhận hàng hoặc theo hướng dẫn cửa hàng — không thu tiền trên web.",
    addPromotionCodes: "Thêm mã khuyến mãi",
    applyPromotion: "Áp dụng",
    promotionsAppliedHeading: "Mã đã áp dụng:",
    removePromotionSr: "Gỡ mã khuyến mãi",
  },
  order: {
    details: "Chi tiết đơn hàng",
    backToOverview: "Về tổng quan",
    summary: "Tóm tắt đơn hàng",
    subtotal: "Tạm tính",
    shipping: "Vận chuyển",
    total: "Tổng cộng",
    discount: "Giảm giá",
    taxes: "Thuế",
  },
  account: {
    account: "Tài khoản",
    hello: "Xin chào",
    profile: "Hồ sơ",
    addresses: "Địa chỉ",
    orders: "Đơn hàng",
    overview: "Tổng quan",
    logOut: "Đăng xuất",
    profileMetaDescription: "Xem và chỉnh sửa hồ sơ tài khoản của bạn.",
    profileIntro:
      "Xem và cập nhật thông tin hồ sơ (họ tên, email, số điện thoại), địa chỉ thanh toán hoặc đổi mật khẩu.",
    overviewMetaDescription: "Tổng quan hoạt động tài khoản của bạn.",
    ordersIntro:
      "Xem đơn hàng trước đây và trạng thái. Bạn có thể tạo yêu cầu đổi trả khi cần.",
    ordersMetaDescription: "Danh sách và trạng thái đơn hàng của bạn.",
    shippingAddressesTitle: "Địa chỉ giao hàng",
    addressesIntro:
      "Xem và cập nhật địa chỉ giao hàng; có thể thêm nhiều địa chỉ. Địa chỉ đã lưu sẽ hiện khi thanh toán.",
    addressesMetaDescription: "Quản lý địa chỉ giao hàng đã lưu.",
  },
  country: {
    shippingTo: "Giao đến:",
  },
  product: {
    continueSetupAdmin: "Tiếp tục thiết lập trong admin",
    onboardingSuccess: "Sản phẩm demo đã được tạo thành công! 🎉",
    onboardingSub:
      "Bạn có thể tiếp tục thiết lập cửa hàng trong admin.",
    addToCart: "Thêm vào giỏ",
    selectVariant: "Chọn phân loại",
    outOfStock: "Hết hàng",
    selectOptions: "Chọn tùy chọn",
  },
  store: {
    metaTitle: "Cửa hàng",
    metaDescription: "Khám phá toàn bộ sản phẩm.",
    allProducts: "Tất cả sản phẩm",
    sortBy: "Sắp xếp",
    sortLatest: "Mới nhất",
    sortPriceAsc: "Giá: thấp → cao",
    sortPriceDesc: "Giá: cao → thấp",
  },
  home: {
    viewAll: "Xem tất cả",
    hero: "Banner chính",
    heroBanners: "Banner quảng cáo",
    heroEmpty:
      "Chưa có banner — thêm trong Medusa Admin → Storefront CMS",
    heroPrev: "Slide trước",
    heroNext: "Slide sau",
    heroSlides: "Danh sách slide",
    heroGoToSlide: "Chuyển đến slide {n}",
    ctaFallback: "Xem thêm",
    bannerImageAlt: "Banner",
    metaFallbackTitle: "Cửa hàng trực tuyến",
    metaDescription:
      "Khám phá sản phẩm và mua sắm trực tuyến.",
  },
  checkoutSteps: {
    shippingAddress: "Địa chỉ giao hàng",
    billingAddress: "Đơn hàng",
    contact: "Liên hệ",
    billingSameAsShipping: "Địa chỉ thanh toán trùng địa chỉ giao hàng.",
    continueToDelivery: "Tiếp tục — Giao hàng",
    edit: "Sửa",
    delivery: "Giao hàng",
    shippingMethod: "Phương thức vận chuyển",
    deliveryHowPrompt: "Bạn muốn nhận đơn hàng như thế nào?",
    pickUpOrder: "Nhận tại cửa hàng",
    storePickupTitle: "Cửa hàng",
    chooseStoreNearYou: "Chọn cửa hàng gần bạn",
    continueToPayment: "Tiếp tục — Thanh toán",
    methodSummary: "Phương thức",
    payment: "Thanh toán",
    paymentMethod: "Phương thức thanh toán",
    giftCard: "Thẻ quà tặng",
    enterCardDetails: "Nhập thông tin thẻ",
    continueToReview: "Tiếp tục — Xem lại",
    paymentDetails: "Chi tiết thanh toán",
    paymentDetailsPending: "Sẽ có bước tiếp theo",
    review: "Xem lại",
    reviewLegal:
      "Bằng cách nhấn Đặt hàng, bạn xác nhận đã đọc và đồng ý Điều khoản sử dụng, Điều khoản bán hàng, Chính sách đổi trả và đã xem Chính sách bảo mật của cửa hàng.",
    placeOrder: "Đặt hàng",
    fullNameLabel: "Họ và tên",
    addressLineLabel: "Địa chỉ",
    phoneLabel: "Số điện thoại",
    savedAddressPrompt: "Xin chào {name}, bạn có muốn dùng một địa chỉ đã lưu không?",
    continueToConfirmOrder: "Tiếp tục — Xác nhận đơn",
    deliveryMethodTitle: "Phương thức giao hàng",
    deliveryMethodSubtitle: "Chọn cách bạn muốn nhận đơn",
    postalCodeLabel: "Mã bưu điện",
    cityLabel: "Tỉnh / Thành phố",
    provinceLabel: "Quận / Huyện",
    chooseSavedAddress: "Chọn địa chỉ đã lưu",
    continueToPlaceOrder: "Tiếp tục đặt hàng",
    confirmPlaceOrderSection: "Xác nhận và đặt hàng",
  },
  orderCompleted: {
    thankYou: "Cảm ơn bạn!",
    orderPlaced: "Đơn hàng của bạn đã được đặt thành công.",
    summaryHeading: "Tóm tắt",
  },
  support: {
    needHelp: "Cần hỗ trợ?",
    contact: "Liên hệ",
    returnsExchanges: "Đổi trả",
  },
  auth: {
    welcomeBack: "Chào mừng trở lại",
    signInBlurb:
      "Đăng nhập để có trải nghiệm mua sắm tốt hơn.",
    email: "Email",
    password: "Mật khẩu",
    emailValidationTitle: "Nhập địa chỉ email hợp lệ.",
    signIn: "Đăng nhập",
    notMember: "Chưa có tài khoản?",
    joinUs: "Tham gia",
    becomeMemberTitle: "Trở thành thành viên {store}",
    createProfileBlurb:
      "Tạo hồ sơ thành viên tại {store} và truy cập trải nghiệm mua sắm nâng cao.",
    firstName: "Tên",
    lastName: "Họ",
    phone: "Điện thoại",
    agreePrefix: "Khi tạo tài khoản, bạn đồng ý với",
    agreePossessiveStore: "",
    privacyPolicy: "Chính sách bảo mật",
    termsConnector: "và",
    termsOfUse: "Điều khoản sử dụng",
    join: "Tham gia",
    alreadyMember: "Đã là thành viên?",
    signInLink: "Đăng nhập",
  },
  accountSupport: {
    gotQuestions: "Bạn có câu hỏi?",
    customerServiceBlurb:
      "Xem câu hỏi thường gặp và câu trả lời trên trang dịch vụ khách hàng.",
    customerService: "Dịch vụ khách hàng",
  },
  productTabs: {
    productInformation: "Thông tin sản phẩm",
    shippingReturns: "Vận chuyển & đổi trả",
    material: "Chất liệu",
    countryOfOrigin: "Xuất xứ",
    type: "Loại",
    weight: "Khối lượng",
    dimensions: "Kích thước",
    weightGrams: "{n} g",
    emptyValue: "—",
    shipFastTitle: "Giao nhanh",
    shipFastBody:
      "Đơn hàng đến trong 3–5 ngày làm việc tại điểm nhận hoặc tận nhà.",
    exchangeTitle: "Đổi hàng đơn giản",
    exchangeBody:
      "Không vừa ý? Chúng tôi hỗ trợ đổi sản phẩm mới cho bạn.",
    returnsTitle: "Hoàn trả dễ dàng",
    returnsBody:
      "Trả hàng và hoàn tiền. Chúng tôi cố gắng xử lý hoàn trả thuận tiện nhất.",
  },
  related: {
    heading: "Sản phẩm liên quan",
    subheading: "Có thể bạn cũng thích các sản phẩm sau.",
  },
  transfer: {
    requestTitle: "Yêu cầu chuyển quyền đơn hàng {id}",
    intro:
      "Bạn nhận được yêu cầu chuyển quyền sở hữu đơn hàng ({id}). Nếu đồng ý, hãy phê duyệt bằng nút bên dưới.",
    acceptExplain:
      "Nếu chấp nhận, người nhận mới sẽ đảm nhận toàn bộ quyền và trách nhiệm liên quan đơn hàng.",
    declineExplain:
      "Nếu không quen yêu cầu này hoặc muốn giữ quyền sở hữu, bạn không cần làm gì thêm.",
    acceptSuccessTitle: "Đã chuyển quyền đơn hàng!",
    acceptSuccessBody:
      "Đơn hàng {id} đã được chuyển thành công cho chủ sở hữu mới.",
    declineSuccessTitle: "Đã từ chối chuyển quyền!",
    declineSuccessBody: "Yêu cầu chuyển quyền đơn hàng {id} đã được từ chối.",
    acceptError: "Không thể chấp nhận chuyển quyền. Vui lòng thử lại.",
    declineError: "Không thể từ chối chuyển quyền. Vui lòng thử lại.",
    errorPrefix: "Lỗi:",
    transferredToast: "Chuyển quyền đơn hàng thành công!",
    declinedToast: "Đã từ chối chuyển quyền thành công!",
    acceptButton: "Chấp nhận",
    declineButton: "Từ chối",
  },
  common: {
    originalPrice: "Giá gốc:",
  },
  metadata: {
    cartTitle: "Giỏ hàng",
    cartDescription: "Xem giỏ hàng của bạn",
    orderConfirmedTitle: "Đã xác nhận đơn hàng",
    orderConfirmedDescription: "Đặt hàng thành công",
    orderDetailTitle: "Đơn hàng #{id}",
    orderDetailDescription: "Xem chi tiết và trạng thái đơn hàng.",
  },
  pagination: {
    navLabel: "Phân trang danh sách",
    goToPage: "Chuyển đến trang {n}",
    currentPage: "Trang {n}, trang hiện tại",
    pageStatus: "Trang {current} trong tổng số {total} trang",
  },
}

const en: StorefrontMessages = {
  nav: {
    account: "Account",
    cartFallback: "Cart",
    collectionsAria: "Site navigation",
    viewMore: "View more",
  },
  sideMenu: {
    button: "Menu",
    closeMenu: "Close menu",
    languageLabel: "Language",
    languageDefault: "Default",
    home: "Home",
    store: "Store",
    account: "Account",
    cart: "Cart",
  },
  footer: {
    tagline:
      "Curated products, convenient delivery. Thanks for stopping by.",
    categories: "Categories",
    collections: "Collections",
    socialHeading: "Contact / Social",
    socialFallback: "Social",
    hotlineLabel: "Hotline",
    emailLabel: "Email",
    customerHeading: "Customer",
    linkStore: "Store",
    linkCart: "Cart",
    linkAccount: "Account",
  },
  cart: {
    title: "Cart",
    emptyTitle: "Cart",
    emptyBody:
      "You don't have anything in your cart. Use the link below to start browsing our products.",
    exploreProducts: "Explore products",
    signInHeading: "Already have an account?",
    signInSub: "Sign in for a better experience.",
    signInCta: "Sign in",
    summary: "Summary",
    goToCheckout: "Place order",
    inYourCartAside: "In your cart",
    tableItem: "Item",
    tableQuantity: "Quantity",
    tablePrice: "Price",
    tableTotal: "Total",
  },
  cartDropdown: {
    title: "Cart",
    quantity: "Quantity:",
    remove: "Remove",
    subtotalExclTaxes: "Subtotal (excl. taxes)",
    goToCart: "Go to cart",
    bagEmpty: "Your shopping bag is empty.",
    exploreProducts: "Explore products",
    exploreSrOnly: "Go to all products page",
  },
  totals: {
    subtotalExclShippingTaxes: "Subtotal (excl. shipping and taxes)",
    shipping: "Shipping",
    discount: "Discount",
    taxes: "Taxes",
    total: "Total",
  },
  checkout: {
    backToCart: "Back to shopping cart",
    backShort: "Back",
    storeFallback: "Store",
    pageTitle: "Checkout",
    selectPaymentMethod: "Select a payment method",
    paymentTestAttention: "Attention:",
    paymentTestBody: "For testing purposes only.",
    codNotice:
      "Pay on delivery or as instructed by the store — no online payment on this site.",
    addPromotionCodes: "Add promotion code(s)",
    applyPromotion: "Apply",
    promotionsAppliedHeading: "Promotion(s) applied:",
    removePromotionSr: "Remove promotion code",
  },
  order: {
    details: "Order details",
    backToOverview: "Back to overview",
    summary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    total: "Total",
    discount: "Discount",
    taxes: "Taxes",
  },
  account: {
    account: "Account",
    hello: "Hello",
    profile: "Profile",
    addresses: "Addresses",
    orders: "Orders",
    overview: "Overview",
    logOut: "Log out",
    profileMetaDescription: "View and edit your account profile.",
    profileIntro:
      "View and update your profile information, including your name, email, and phone number. You can also update your billing address, or change your password.",
    overviewMetaDescription: "Overview of your account activity.",
    ordersIntro:
      "View your previous orders and their status. You can also create returns or exchanges for your orders if needed.",
    ordersMetaDescription: "Your past orders and their status.",
    shippingAddressesTitle: "Shipping addresses",
    addressesIntro:
      "View and update your shipping addresses; you can add as many as you like. Saved addresses are available at checkout.",
    addressesMetaDescription: "Manage your saved shipping addresses.",
  },
  country: {
    shippingTo: "Shipping to:",
  },
  product: {
    continueSetupAdmin: "Continue setup in admin",
    onboardingSuccess: "Your demo product was successfully created! 🎉",
    onboardingSub:
      "You can now continue setting up your store in the admin.",
    addToCart: "Add to cart",
    selectVariant: "Select variant",
    outOfStock: "Out of stock",
    selectOptions: "Select options",
  },
  store: {
    metaTitle: "Store",
    metaDescription: "Explore all of our products.",
    allProducts: "All products",
    sortBy: "Sort by",
    sortLatest: "Latest arrivals",
    sortPriceAsc: "Price: Low → High",
    sortPriceDesc: "Price: High → Low",
  },
  home: {
    viewAll: "View all",
    hero: "Hero",
    heroBanners: "Hero banners",
    heroEmpty:
      "No banners yet — add them in Medusa Admin → Storefront CMS",
    heroPrev: "Previous slide",
    heroNext: "Next slide",
    heroSlides: "Slides",
    heroGoToSlide: "Go to slide {n}",
    ctaFallback: "Learn more",
    bannerImageAlt: "Banner",
    metaFallbackTitle: "Online store",
    metaDescription: "Discover products and shop online.",
  },
  checkoutSteps: {
    shippingAddress: "Shipping address",
    billingAddress: "Order",
    contact: "Contact",
    billingSameAsShipping: "Billing and delivery address are the same.",
    continueToDelivery: "Continue to delivery",
    edit: "Edit",
    delivery: "Delivery",
    shippingMethod: "Shipping method",
    deliveryHowPrompt: "How would you like your order delivered?",
    pickUpOrder: "Pick up your order",
    storePickupTitle: "Store",
    chooseStoreNearYou: "Choose a store near you",
    continueToPayment: "Continue to payment",
    methodSummary: "Method",
    payment: "Payment",
    paymentMethod: "Payment method",
    giftCard: "Gift card",
    enterCardDetails: "Enter card details",
    continueToReview: "Continue to review",
    paymentDetails: "Payment details",
    paymentDetailsPending: "Another step will appear",
    review: "Review",
    reviewLegal:
      "By clicking Place order, you confirm that you have read and accept our Terms of Use, Terms of Sale and Returns Policy, and acknowledge the store's Privacy Policy.",
    placeOrder: "Place order",
    fullNameLabel: "Full name",
    addressLineLabel: "Address",
    phoneLabel: "Phone number",
    savedAddressPrompt: "Hi {name}, do you want to use one of your saved addresses?",
    continueToConfirmOrder: "Continue — Confirm order",
    deliveryMethodTitle: "Delivery method",
    deliveryMethodSubtitle: "Choose how you want to receive your order",
    postalCodeLabel: "Postal code",
    cityLabel: "City",
    provinceLabel: "State / Province",
    chooseSavedAddress: "Choose a saved address",
    continueToPlaceOrder: "Continue to place order",
    confirmPlaceOrderSection: "Confirm and place order",
  },
  orderCompleted: {
    thankYou: "Thank you!",
    orderPlaced: "Your order was placed successfully.",
    summaryHeading: "Summary",
  },
  support: {
    needHelp: "Need help?",
    contact: "Contact",
    returnsExchanges: "Returns & exchanges",
  },
  auth: {
    welcomeBack: "Welcome back",
    signInBlurb: "Sign in for an enhanced shopping experience.",
    email: "Email",
    password: "Password",
    emailValidationTitle: "Enter a valid email address.",
    signIn: "Sign in",
    notMember: "Not a member?",
    joinUs: "Join us",
    becomeMemberTitle: "Become a {store} member",
    createProfileBlurb:
      "Create your {store} member profile for an enhanced shopping experience.",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    agreePrefix: "By creating an account, you agree to",
    agreePossessiveStore: "{store}'s ",
    privacyPolicy: "Privacy Policy",
    termsConnector: "and",
    termsOfUse: "Terms of Use",
    join: "Join",
    alreadyMember: "Already a member?",
    signInLink: "Sign in",
  },
  accountSupport: {
    gotQuestions: "Got questions?",
    customerServiceBlurb:
      "Find answers on our customer service page.",
    customerService: "Customer service",
  },
  productTabs: {
    productInformation: "Product information",
    shippingReturns: "Shipping & returns",
    material: "Material",
    countryOfOrigin: "Country of origin",
    type: "Type",
    weight: "Weight",
    dimensions: "Dimensions",
    weightGrams: "{n} g",
    emptyValue: "—",
    shipFastTitle: "Fast delivery",
    shipFastBody:
      "Your package arrives in 3–5 business days for pickup or home delivery.",
    exchangeTitle: "Simple exchanges",
    exchangeBody:
      "Not quite the right fit? We'll exchange your product for a new one.",
    returnsTitle: "Easy returns",
    returnsBody:
      "Return your product for a refund. We'll do our best to make returns hassle-free.",
  },
  related: {
    heading: "Related products",
    subheading: "You might also want to check out these products.",
  },
  transfer: {
    requestTitle: "Transfer request for order {id}",
    intro:
      "You've received a request to transfer ownership of your order ({id}). If you agree, approve the transfer below.",
    acceptExplain:
      "If you accept, the new owner takes over all responsibilities for this order.",
    declineExplain:
      "If you don't recognize this request or want to keep ownership, no further action is needed.",
    acceptSuccessTitle: "Order transferred!",
    acceptSuccessBody: "Order {id} was successfully transferred to the new owner.",
    declineSuccessTitle: "Transfer declined!",
    declineSuccessBody: "The transfer for order {id} was successfully declined.",
    acceptError: "Could not accept the transfer. Please try again.",
    declineError: "Could not decline the transfer. Please try again.",
    errorPrefix: "Error:",
    transferredToast: "Order transferred successfully!",
    declinedToast: "Transfer declined successfully!",
    acceptButton: "Accept transfer",
    declineButton: "Decline transfer",
  },
  common: {
    originalPrice: "Original:",
  },
  metadata: {
    cartTitle: "Cart",
    cartDescription: "View your cart",
    orderConfirmedTitle: "Order confirmed",
    orderConfirmedDescription: "Your purchase was successful",
    orderDetailTitle: "Order #{id}",
    orderDetailDescription: "View your order details and status.",
  },
  pagination: {
    navLabel: "Product list pagination",
    goToPage: "Go to page {n}",
    currentPage: "Page {n}, current page",
    pageStatus: "Page {current} of {total}",
  },
}

/** FR-17 — bản MVP: nhãn UI tiếng Nhật lấy copy tiếng Anh (có thể tinh chỉnh sau). */
const ja: StorefrontMessages = structuredClone(en)

const byLocale: Record<AppLocale, StorefrontMessages> = {
  vi,
  en,
  ja,
}

export function getStorefrontMessages(locale: string): StorefrontMessages {
  const l: AppLocale = isAppLocale(locale) ? locale : DEFAULT_LOCALE
  return byLocale[l]
}
