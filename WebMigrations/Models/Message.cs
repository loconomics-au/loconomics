namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class Message
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public Message()
        {
            MessagingThreads = new HashSet<MessagingThread>();
        }

        public int MessageID { get; set; }

        public int ThreadID { get; set; }

        public int MessageTypeID { get; set; }

        public int? AuxID { get; set; }

        [StringLength(50)]
        public string AuxT { get; set; }

        [Required]
        [StringLength(4000)]
        public string BodyText { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(50)]
        public string ModifiedBy { get; set; }

        public int SentByUserId { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<MessagingThread> MessagingThreads { get; set; }
    }
}
