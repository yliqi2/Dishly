<?php
// app/Models/RecetaOriginal.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecetaOriginal extends Model
{
    protected $table = 'receta_original';
    protected $primaryKey = 'id_receta';
    public $timestamps = false;
    
    protected $fillable = [
        'titulo', 'descripcion', 'instrucciones', 'tiempo_preparacion',
        'tiempo_preparacion_unidad', 'dificultad', 'porciones', 'price',
        'imagen_1', 'imagen_2', 'imagen_3', 'imagen_4', 'imagen_5',
        'fecha_creacion', 'id_autor', 'active'
    ];
    
    protected $casts = [
        'active' => 'boolean',
        'price' => 'decimal:2'
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
    
    // Scope para recetas activas
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }
    
    // Accesor para obtener todas las imágenes como array
    public function getImagenesAttribute()
    {
        return array_filter([
            $this->imagen_1,
            $this->imagen_2,
            $this->imagen_3,
            $this->imagen_4,
            $this->imagen_5
        ]);
    }
}