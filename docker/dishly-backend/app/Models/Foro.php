<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Foro extends Model
{
    protected $table = 'foro';

    protected $primaryKey = 'id_foro';

    protected $fillable = [
        'titulo',
        'descripcion',
        'fecha_creacion',
        'id_usuario',
        'id_receta',
    ];

    public $timestamps = true;

    public function propietario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }

    public function comentarios(): HasMany
    {
        return $this->hasMany(LineaForo::class, 'id_foro', 'id_foro');
    }
}
