namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("booking")]
    public partial class booking
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public booking()
        {
            booking1 = new HashSet<booking>();
            ServiceProfessionalClients = new HashSet<ServiceProfessionalClient>();
        }

        public int BookingID { get; set; }

        public int? ClientUserID { get; set; }

        public int? ServiceProfessionalUserID { get; set; }

        public int JobTitleID { get; set; }

        public int LanguageID { get; set; }

        public int CountryID { get; set; }

        public int BookingStatusID { get; set; }

        public int BookingTypeID { get; set; }

        public int CancellationPolicyID { get; set; }

        public int? ParentBookingID { get; set; }

        public int? ServiceAddressID { get; set; }

        public int? ServiceDateID { get; set; }

        public int? AlternativeDate1ID { get; set; }

        public int? AlternativeDate2ID { get; set; }

        public int PricingSummaryID { get; set; }

        public int PricingSummaryRevision { get; set; }

        [StringLength(250)]
        public string PaymentTransactionID { get; set; }

        [StringLength(64)]
        public string PaymentLastFourCardNumberDigits { get; set; }

        [StringLength(250)]
        public string paymentMethodID { get; set; }

        [StringLength(250)]
        public string cancellationPaymentTransactionID { get; set; }

        public decimal? ClientPayment { get; set; }

        public decimal? ServiceProfessionalPaid { get; set; }

        public decimal? ServiceProfessionalPPFeePaid { get; set; }

        public decimal? LoconomicsPaid { get; set; }

        public decimal? LoconomicsPPFeePaid { get; set; }

        public bool InstantBooking { get; set; }

        public bool FirstTimeBooking { get; set; }

        public bool SendReminder { get; set; }

        public bool SendPromotional { get; set; }

        public bool Recurrent { get; set; }

        public bool MultiSession { get; set; }

        public bool PricingAdjustmentApplied { get; set; }

        public bool PaymentEnabled { get; set; }

        public bool PaymentCollected { get; set; }

        public bool PaymentAuthorized { get; set; }

        public int? AwaitingResponseFromUserID { get; set; }

        public bool PricingAdjustmentRequested { get; set; }

        [StringLength(200)]
        public string SupportTicketNumber { get; set; }

        [Required]
        [StringLength(400)]
        public string MessagingLog { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public string SpecialRequests { get; set; }

        public string PreNotesToClient { get; set; }

        public string PostNotesToClient { get; set; }

        public string PreNotesToSelf { get; set; }

        public string PostNotesToSelf { get; set; }

        public virtual address address { get; set; }

        public virtual CalendarEvent CalendarEvent { get; set; }

        public virtual CalendarEvent CalendarEvent1 { get; set; }

        public virtual user user { get; set; }

        public virtual cancellationpolicy cancellationpolicy { get; set; }

        public virtual user user1 { get; set; }

        public virtual position position { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<booking> booking1 { get; set; }

        public virtual booking booking2 { get; set; }

        public virtual pricingSummary pricingSummary { get; set; }

        public virtual CalendarEvent CalendarEvent2 { get; set; }

        public virtual user user2 { get; set; }

        public virtual bookingStatus bookingStatus { get; set; }

        public virtual bookingType bookingType { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<ServiceProfessionalClient> ServiceProfessionalClients { get; set; }
    }
}
