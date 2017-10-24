namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("ServiceProfessionalClient")]
    public partial class ServiceProfessionalClient
    {
        [Key]
        [Column(Order = 0)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ServiceProfessionalUserID { get; set; }

        [Key]
        [Column(Order = 1)]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int ClientUserID { get; set; }

        [Required]
        public string NotesAboutClient { get; set; }

        public int ReferralSourceID { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        public bool Active { get; set; }

        public int? CreatedByBookingID { get; set; }

        public bool DeletedByServiceProfessional { get; set; }

        public virtual booking booking { get; set; }

        public virtual ReferralSource ReferralSource { get; set; }

        public virtual user user { get; set; }

        public virtual user user1 { get; set; }
    }
}
