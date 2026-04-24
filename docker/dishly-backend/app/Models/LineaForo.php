<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LineaForo extends Model
{
    protected $table = 'linea_foro';

    protected $primaryKey = 'id_linea_foro';

    protected $fillable = [
        'mensaje',
        'fecha',
        'id_foro',
        'id_usuario',
    ];

    public $timestamps = true;

    public function foro(): BelongsTo
    {
        return $this->belongsTo(Foro::class, 'id_foro', 'id_foro');
    }

    public function autor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario', 'id_usuario');
    }
}
