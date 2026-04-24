<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecetaOriginal extends Model
{
    protected $table = 'receta_original';

    protected $primaryKey = 'id_receta';

    protected $fillable = [
        'titulo', 'descripcion', 'instrucciones', 'tiempo_preparacion',
        'tiempo_preparacion_unidad', 'dificultad', 'porciones', 'price',
        'imagen_1', 'imagen_2', 'imagen_3', 'imagen_4', 'imagen_5',
        'fecha_creacion', 'id_autor', 'active', 'created_at', 'updated_at',
    ];

    protected $casts = [
        'active' => 'boolean',
        'price' => 'decimal:2',
    ];

    public function ingredientes()
    {
        return $this->belongsToMany(
            Ingrediente::class,
            'receta_ingrediente',
            'id_receta',
            'id_ingrediente'
        )->withPivot('cantidad', 'unidad');
    }

    public function autor()
    {
        return $this->belongsTo(User::class, 'id_autor', 'id_usuario');
    }

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    public function getImagenesAttribute()
    {
        return array_filter([
            $this->imagen_1,
            $this->imagen_2,
            $this->imagen_3,
            $this->imagen_4,
            $this->imagen_5,
        ]);
    }
}
