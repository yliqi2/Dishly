<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecetaIngrediente extends Model
{
    protected $table = 'receta_ingrediente';

    protected $primaryKey = null;

    public $incrementing = false;

    public $timestamps = false;
}
