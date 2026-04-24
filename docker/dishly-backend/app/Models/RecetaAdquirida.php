<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecetaAdquirida extends Model
{
    protected $table = 'receta_adquirida';

    protected $primaryKey = 'id_adquirida';

    public $timestamps = false;
}
