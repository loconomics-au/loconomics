namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class user
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public user()
        {
            bookings = new HashSet<booking>();
            bookings1 = new HashSet<booking>();
            bookings2 = new HashSet<booking>();
            MessagingThreads = new HashSet<MessagingThread>();
            MessagingThreads1 = new HashSet<MessagingThread>();
            serviceaddresses = new HashSet<serviceaddress>();
            ServiceProfessionalClients = new HashSet<ServiceProfessionalClient>();
            ServiceProfessionalClients1 = new HashSet<ServiceProfessionalClient>();
            userbackgroundchecks = new HashSet<userbackgroundcheck>();
            usereducations = new HashSet<usereducation>();
            UserLicenseCertifications = new HashSet<UserLicenseCertification>();
            UserLicenseCertifications1 = new HashSet<UserLicenseCertification>();
            userprofilepositions = new HashSet<userprofileposition>();
        }

        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int UserID { get; set; }

        [Required]
        [StringLength(50)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(1)]
        public string MiddleIn { get; set; }

        [Required]
        [StringLength(145)]
        public string LastName { get; set; }

        [Required]
        [StringLength(145)]
        public string SecondLastName { get; set; }

        [StringLength(50)]
        public string NickName { get; set; }

        [StringLength(4000)]
        public string PublicBio { get; set; }

        public int GenderID { get; set; }

        public int? PreferredLanguageID { get; set; }

        public int? PreferredCountryID { get; set; }

        public bool IsProvider { get; set; }

        public bool IsCustomer { get; set; }

        public bool IsAdmin { get; set; }

        public bool IsCollaborator { get; set; }

        [StringLength(150)]
        public string Photo { get; set; }

        [StringLength(20)]
        public string MobilePhone { get; set; }

        [StringLength(20)]
        public string AlternatePhone { get; set; }

        public bool CanReceiveSms { get; set; }

        [StringLength(2078)]
        public string ProviderProfileURL { get; set; }

        [StringLength(2078)]
        public string ProviderWebsiteURL { get; set; }

        public bool SMSBookingCommunication { get; set; }

        public bool PhoneBookingCommunication { get; set; }

        public bool LoconomicsMarketingCampaigns { get; set; }

        public bool ProfileSEOPermission { get; set; }

        public DateTime? CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }

        [StringLength(50)]
        public string ModifiedBy { get; set; }

        public bool? Active { get; set; }

        public bool LoconomicsCommunityCommunication { get; set; }

        public bool? IAuthZumigoVerification { get; set; }

        public bool? IAuthZumigoLocation { get; set; }

        public bool LoconomicsDBMCampaigns { get; set; }

        public int AccountStatusID { get; set; }

        public bool CoBrandedPartnerPermissions { get; set; }

        [StringLength(2055)]
        public string MarketingSource { get; set; }

        [StringLength(64)]
        public string BookCode { get; set; }

        [StringLength(60)]
        public string OnboardingStep { get; set; }

        public int? BirthMonthDay { get; set; }

        public int? BirthMonth { get; set; }

        [StringLength(145)]
        public string BusinessName { get; set; }

        [StringLength(56)]
        public string AlternativeEmail { get; set; }

        public int? ReferredByUserID { get; set; }

        [StringLength(20)]
        public string SignupDevice { get; set; }

        public int? OwnerStatusID { get; set; }

        public DateTime? OwnerAnniversaryDate { get; set; }

        public bool IsHipaaAdmin { get; set; }

        public bool? IsContributor { get; set; }

        public DateTimeOffset? TrialEndDate { get; set; }

        public virtual accountstatus accountstatus { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<booking> bookings { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<booking> bookings1 { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<booking> bookings2 { get; set; }

        public virtual CalendarProviderAttribute CalendarProviderAttribute { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<MessagingThread> MessagingThreads { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<MessagingThread> MessagingThreads1 { get; set; }

        public virtual OwnerAcknowledgment OwnerAcknowledgment { get; set; }

        public virtual OwnerStatus OwnerStatus { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<serviceaddress> serviceaddresses { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<ServiceProfessionalClient> ServiceProfessionalClients { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<ServiceProfessionalClient> ServiceProfessionalClients1 { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<userbackgroundcheck> userbackgroundchecks { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<usereducation> usereducations { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<UserLicenseCertification> UserLicenseCertifications { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<UserLicenseCertification> UserLicenseCertifications1 { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<userprofileposition> userprofilepositions { get; set; }

        public virtual UserStat UserStat { get; set; }
    }
}
