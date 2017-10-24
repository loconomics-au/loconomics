namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("licensecertification")]
    public partial class licensecertification
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LicenseCertificationID { get; set; }

        [Required]
        [StringLength(100)]
        public string LicenseCertificationType { get; set; }

        [StringLength(4000)]
        public string LicenseCertificationTypeDescription { get; set; }

        [StringLength(500)]
        public string LicenseCertificationAuthority { get; set; }

        [StringLength(2078)]
        public string VerificationWebsiteURL { get; set; }

        [StringLength(2078)]
        public string HowToGetLicensedURL { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int LanguageID { get; set; }
    }
}
