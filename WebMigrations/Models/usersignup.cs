namespace WebMigrations.Models
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel.DataAnnotations;
    using System.ComponentModel.DataAnnotations.Schema;
    using System.Data.Entity.Spatial;

    [Table("usersignup")]
    public partial class usersignup
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [StringLength(56)]
        public string Email { get; set; }
    }
}
