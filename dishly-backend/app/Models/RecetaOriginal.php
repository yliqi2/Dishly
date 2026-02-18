<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecetaOriginal extends Model
{
    protected $table = 'receta_original';

    protected $primaryKey = 'id_receta';

    public $timestamps = false;
}
