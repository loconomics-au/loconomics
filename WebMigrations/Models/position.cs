namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class position
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public position()
        {
            bookings = new HashSet<booking>();
            positionpricingtypes = new HashSet<positionpricingtype>();
            userprofilepositions = new HashSet<userprofileposition>();
        }

        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int PositionID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }

        [Key]
        [Column(Order = 2)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CountryID { get; set; }

        [StringLength(200)]
        public string PositionSingular { get; set; }

        [StringLength(200)]
        public string PositionPlural { get; set; }

        [StringLength(200)]
        public string Aliases { get; set; }

        [StringLength(2000)]
        public string PositionDescription { get; set; }

        public DateTime? CreatedDate { get; set; }

        public DateTime? UpdatedDate { get; set; }

        [StringLength(2)]
        public string ModifiedBy { get; set; }

        [StringLength(20)]
        public string GovID { get; set; }

        [StringLength(200)]
        public string GovPosition { get; set; }

        [StringLength(2000)]
        public string GovPositionDescription { get; set; }

        public bool? Active { get; set; }

        public int? DisplayRank { get; set; }

        [StringLength(1000)]
        public string PositionSearchDescription { get; set; }

        public bool AttributesComplete { get; set; }

        public bool StarRatingsComplete { get; set; }

        public bool PricingTypeComplete { get; set; }

        public int? EnteredByUserID { get; set; }

        public bool? Approved { get; set; }

        public int AddGratuity { get; set; }

        public bool HIPAA { get; set; }

        public bool SendReviewReminderToClient { get; set; }

        public bool CanBeRemote { get; set; }

        public bool SuppressReviewOfClient { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<booking> bookings { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<positionpricingtype> positionpricingtypes { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<userprofileposition> userprofilepositions { get; set; }
    }
}
