namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class UserLicenseCertification
    {
        public int userLicenseCertificationID { get; set; }

        public int ProviderUserID { get; set; }

        public int PositionID { get; set; }

        public int LicenseCertificationID { get; set; }

        public int VerificationStatusID { get; set; }

        [StringLength(2073)]
        public string LicenseCertificationURL { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; }

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }

        [StringLength(1)]
        public string MiddleInitial { get; set; }

        [StringLength(100)]
        public string SecondLastName { get; set; }

        [StringLength(200)]
        public string BusinessName { get; set; }

        [StringLength(100)]
        public string LicenseCertificationNumber { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime? ExpirationDate { get; set; }

        public DateTime? IssueDate { get; set; }

        [StringLength(500)]
        public string Comments { get; set; }

        [StringLength(25)]
        public string VerifiedBy { get; set; }

        public DateTime? LastVerifiedDate { get; set; }

        [StringLength(25)]
        public string SubmittedBy { get; set; }

        [StringLength(255)]
        public string SubmittedImageLocalURL { get; set; }

        public virtual user user { get; set; }

        public virtual user user1 { get; set; }
    }
}
