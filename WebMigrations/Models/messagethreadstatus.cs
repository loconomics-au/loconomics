namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    public partial class messagethreadstatus
    {
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public messagethreadstatus()
        {
            MessagingThreads = new HashSet<MessagingThread>();
        }

        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int MessageThreadStatusID { get; set; }

        [Required]
        [StringLength(25)]
        public string MessageThreadStatusName { get; set; }

        [StringLength(100)]
        public string MessageThreadStatusDescription { get; set; }

        public DateTime CreatedDate { get; set; }

        public DateTime UpdatedDate { get; set; }

        [Required]
        [StringLength(25)]
        public string ModifiedBy { get; set; }

        public bool Active { get; set; }

        [Required]
        [StringLength(7)]
        public string MessageStatusColor { get; set; }

        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<MessagingThread> MessagingThreads { get; set; }
    }
}
