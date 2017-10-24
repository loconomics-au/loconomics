namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("VOCFeedback")]
    public partial class VOCFeedback
    {
        public int VOCFeedbackID { get; set; }

        public int VOCElementID { get; set; }

        public int VOCExperienceCategoryID { get; set; }

        public int UserID { get; set; }

        [Required]
        public string Feedback { get; set; }

        [StringLength(50)]
        public string VOCFlag1 { get; set; }

        [StringLength(50)]
        public string VOCFlag2 { get; set; }

        [StringLength(50)]
        public string VOCFlag3 { get; set; }

        [StringLength(50)]
        public string VOCFlag4 { get; set; }

        public string UserDevice { get; set; }

        public int? ZenDeskTicketNumber { get; set; }

        public int? ProviderUserID { get; set; }

        public int? ProviderPositionID { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(3)]
        public string ModifiedBy { get; set; }
    }
}
