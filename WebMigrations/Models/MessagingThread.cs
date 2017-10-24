namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class MessagingThread
    {
        [Key]
        public int ThreadID { get; set; }

        public int CustomerUserID { get; set; }

        public int ProviderUserID { get; set; }

        public int? PositionID { get; set; }

        public int MessageThreadStatusID { get; set; }

        [StringLength(100)]
        public string Subject { get; set; }

        public int? LastMessageID { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(50)]
        public string ModifiedBy { get; set; }

        public virtual Message Message { get; set; }

        public virtual messagethreadstatus messagethreadstatus { get; set; }

        public virtual user user { get; set; }

        public virtual user user1 { get; set; }
    }
}
