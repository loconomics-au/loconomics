namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class userprofileposition
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public userprofileposition()
        {
            userprofileserviceattributes = new HashSet<userprofileserviceattribute>();
        }

        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int UserID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PositionID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 3)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        public DateTime? CreateDate { get; set; }

        public DateTime? UpdatedDate { get; set; }

        [StringLength(3)]
        public string ModifiedBy { get; set; }

        public bool? Active { get; set; }

        [StringLength(2000)]
        public string PositionIntro { get; set; }

        public int StatusID { get; set; }

        public int? CancellationPolicyID { get; set; }

        [StringLength(500)]
        public string additionalinfo1 { get; set; }

        [StringLength(500)]
        public string additionalinfo2 { get; set; }

        [StringLength(500)]
        public string additionalinfo3 { get; set; }

        public bool InstantBooking { get; set; }

        public bool bookMeButtonReady { get; set; }

        public bool collectPaymentAtBookMeButton { get; set; }

        public virtual accountstatus accountstatus { get; set; }

        public virtual position position { get; set; }

        public virtual user user { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<userprofileserviceattribute> userprofileserviceattributes { get; set; }
    }
}
