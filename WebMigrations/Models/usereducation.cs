namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("usereducation")]
    public partial class usereducation
    {
        public int UserEducationID { get; set; }

        public int UserID { get; set; }

        public int InstitutionID { get; set; }

        [Required]
        [StringLength(200)]
        public string DegreeCertificate { get; set; }

        [Required]
        [StringLength(200)]
        public string FieldOfStudy { get; set; }

        public decimal? FromYearAttended { get; set; }

        public decimal? ToYearAttended { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime ModifiedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public DateTime? VerifiedDate { get; set; }

        [StringLength(25)]
        public string VerifiedBy { get; set; }

        public bool Active { get; set; }

        public virtual institution institution { get; set; }

        public virtual user user { get; set; }
    }
}
